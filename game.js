// game.js

// Player classes:
// 
// Warrior
// HP: 250
// Skills:
//  Slam: 30 damage
//  Last Stand: 100 hp (cooldown: 10 turns)
//  Sword Tornado: 10 AOE damage for 3 turns

// Paladin
// HP: 200
// Skills:
//  Judgement: 30 damage
//  Consecration: 10 AOE damage for 5 turns
//  Flash of light: 50 hp (cast time: 1 turn)
//
// Wizard
// HP: 100
// Skills:
//  Arcane Shield: 100 hp (cooldown: 3 turns)
//  Fire Blast: 50 damage
//  Blizzard: 20 AOE damage for 5 turns
//

class Skill {
  constructor(name) {
    this.name = name;
    this.damage_lower = 0;
    this.damage_upper = 0;
    this.healing = 0;
    this.cast_time = 0;
    this.cool_down = 0;
    this.duration = 1;
    this.aoe = false;
    this.self_only = false;
    this.extends_hp = false;
    this.is_debuf = false;
    this.is_multi_turn_action = false;
  }

  IsDamagingSkill() {
    return this.damage_lower > 0 || this.damage_upper > 0;
  }
}

class Debuf {
  constructor(skill, duration) {
    this.skill = skill;
    this.duration = duration;
  }
}

class CoolDown {
  constructor(skill, duration) {
    this.skill = skill;
    this.duration = duration;
  }
}

class Action {
  constructor(skill, duration) {
    this.skill = skill;
    this.duration = duration;
  }
}

class CharacterClass {
  constructor(name, hp) {
    this.name = name;
    this.hp = hp;
    this.skills = [];
  }
}

class Character {
  constructor(name, character_class) {
    this.name = name;
    this.character_class = character_class;
    this.hp = character_class.hp;
    this.target_character_index = -1;
    this.debufs = [];
    this.cool_downs = [];
    this.current_action = null;
  }
}

var warrior_class;
var paladin_class;
var wizard_class;

function BuildWarriorClass() {
  warrior_class = new CharacterClass("warrior", 250);

  var slam = new Skill("Slam");
  slam.damage_lower = 30;
  slam.damage_upper = 30;
  warrior_class.skills.push(slam);

  var last_stand = new Skill("Last Stand");
  last_stand.healing = 100;
  last_stand.cool_down = 10;
  last_stand.self_only = true;
  last_stand.extends_hp = true;
  warrior_class.skills.push(last_stand);

  var sword_tornado = new Skill("Sword Tornado");
  sword_tornado.damage_lower = 10;
  sword_tornado.damage_upper = 10;
  sword_tornado.aoe = true;
  sword_tornado.duration = 3;
  sword_tornado.is_multi_turn_action = true;
  warrior_class.skills.push(sword_tornado);
}

function NewBasicClass(name, hp, damage_lower, damage_upper) {
  var new_class = new CharacterClass(name, hp);

  var strike = new Skill("Strike");
  strike.damage_lower = damage_lower;
  strike.damage_upper = damage_upper;
  new_class.skills.push(strike);

  return new_class;
}

function Initialize() {
  BuildWarriorClass();
  RebuildUI();
}

var players = [];
var mobs = [];
var active_character_index = -1;

function AddPlayer() {
  // For now, just add only warriors.
  var name = window.prompt("Enter the name of the new player");
  var new_player = new Character(name, warrior_class);
  players.push(new_player);

  RebuildUI();
}

function AddMob() {
  // temporary

  var naga_class = NewBasicClass("Naga", 100, 10, 60);
  var naga = new Character("Naga", naga_class);
  mobs.push(naga);

  RebuildUI();
}

function RebuildUI() {
  var players_div = document.getElementById("players");
  var mobs_div = document.getElementById("mobs");

  var character_index = 0;

  // players:

  players_div.innerHTML = "<b>Players</b>";

  for (var player of players) {
    var div = document.createElement("DIV");

    if (character_index == active_character_index)
      div.setAttribute("class", "character_box active_character");
    else
      div.setAttribute("class", "character_box");

    div.innerHTML = 
        "[" + character_index + "] " + player.name + " (" + player.hp + "hp) " +
        " target: ";

    var input = document.createElement("INPUT");
    input.setAttribute("value", player.target_character_index);
    input.setAttribute("onchange", "DoSetTargetCharacterIndex()");
    if (character_index != active_character_index)
      input.setAttribute("disabled", "true");
    div.appendChild(input);
        
    for (var skill of player.character_class.skills) {
      var input = document.createElement("INPUT");
      input.setAttribute("type", "button");
      input.setAttribute("onclick", "DoSkill()");

      var cool_down = GetCoolDown(player, skill);
      if (cool_down) {
        input.setAttribute("value", skill.name + " (" + cool_down.duration + ")");
      } else {
        input.setAttribute("value", skill.name);
      }

      if (character_index != active_character_index || player.hp == 0 || cool_down)
        input.setAttribute("disabled", "true");

      div.appendChild(input);
    }

    if (player.current_action) {
      div.appendChild(
          document.createTextNode(
              "action: " + player.current_action.skill.name +
              " (" + player.current_action.duration + ")"));
    }

    players_div.appendChild(div);

    character_index++;
  }

  // mobs:

  mobs_div.innerHTML = "<b>Mobs</b>";

  for (var mob of mobs) {
    var div = document.createElement("DIV");

    if (character_index == active_character_index)
      div.setAttribute("class", "character_box active_character");
    else
      div.setAttribute("class", "character_box");

    div.innerHTML =
        "[" + character_index + "] " + mob.name + " (" + mob.hp + "hp) " +
        " target: " + mob.target_character_index;

    var input = document.createElement("INPUT");
    input.setAttribute("type", "button");
    input.setAttribute("value", "Take turn");
    input.setAttribute("onclick", "DoMobTurn()");

    if (character_index != active_character_index || mob.hp == 0)
      input.setAttribute("disabled", "true");

    div.appendChild(input);
        
    mobs_div.appendChild(div);

    character_index++;
  }

  var add_player_button = document.getElementById("add_player_button");
  var add_mob_button = document.getElementById("add_mob_button");
  var battle_button = document.getElementById("battle_button");
  var skipturn_button = document.getElementById("skipturn_button");

  if (active_character_index == -1) {
    add_player_button.removeAttribute("disabled");
    add_mob_button.removeAttribute("disabled");
    skipturn_button.setAttribute("disabled", "true");
    if (players.length == 0 || mobs.length == 0) {
      battle_button.setAttribute("disabled", "true");
    } else {
      battle_button.removeAttribute("disabled");
    }
  } else {
    add_player_button.setAttribute("disabled", "true");
    add_mob_button.setAttribute("disabled", "true");
    battle_button.setAttribute("disabled", "true");
    skipturn_button.removeAttribute("disabled");
  }
}

function Battle() {
  console.log("Battle!");

  active_character_index = 0;

  UpdateTargetOfMobs();
  RebuildUI();
}

function SkipTurn() {
  console.log("Skip turn!");

  UpdateCurrentAction(GetCharacter(active_character_index));

  NextTurn();
  RebuildUI();
}

function NextTurn() {
  UpdateCoolDowns(GetCharacter(active_character_index));

  var total_players = players.length;
  var total_mobs = mobs.length;
  var total_characters = total_players + total_mobs;

  active_character_index++;

  // Wrap around if needed.
  if (active_character_index == total_characters)
    active_character_index = 0;

  UpdateTargetOfMobs();

  if (GetCharacter(active_character_index).hp == 0)
    NextTurn();
}

function UpdateCoolDowns(character) {
  var new_cool_downs = [];
  for (var cool_down of character.cool_downs) {
    cool_down.duration--;
    if (cool_down.duration > 0)
      new_cool_downs.push(cool_down); 
  }
  character.cool_downs = new_cool_downs;
}

function UpdateCurrentAction(character) {
  if (!character.current_action)
    return;

  var skill = character.current_action.skill;

  // We only know how to update actions that are AOE damaging skills.
  if (!(skill.aoe && skill.IsDamagingSkill()))
    return;

  for (var mob of mobs)
    ApplySkillToCharacter(mob, skill);

  if (--character.current_action.duration == 0)
    character.current_action = null;
}

function UpdateTargetOfMobs() {
  var total_players = players.length;
  var total_mobs = mobs.length;
  var total_characters = total_players + total_mobs;

  // For now, we just always have mobs target the warrior, but we should do
  // something more interesting based on threat calculations.

  var index;

  for (index = 0; index < total_players; ++index) {
    var player = players[index];
    if (player.hp != 0 && player.character_class.name == "Warrior")
      break;
  }
  if (index == total_players) {  // Fallback to first player.
    for (index = 0; index < total_players; ++index) {
      var player = players[index];
      if (player.hp != 0)
        break;
    }
  }

  for (var mob of mobs) {
    if (mob.hp == 0) {
      mob.target_character_index = -1;
    } else {
      mob.target_character_index = index;
    }
  }
}

function GetCharacter(index) {
  var total_players = players.length;
  var total_mobs = mobs.length;
  var total_characters = total_players + total_mobs;

  if (index < 0)
    return null;
  if (index < total_players)
    return players[index];
  if (index < total_characters)
    return mobs[index - total_players];

  return null;
}

function DoSkill() {
  var input = event.target;

  console.log("DoSkill: " + input.value);
  var selected_skill_name = input.value;

  var player = players[active_character_index];

  // Replaces any current action.
  player.current_action = null;

  // Find the selected skill
  var selected_skill;
  for (var skill of player.character_class.skills) {
    if (skill.name == selected_skill_name)
      selected_skill = skill;
  }

  // If on cool down, then we cannot perform this action now.
  // Should not be reached if on cool down.
  for (var cool_down of player.cool_downs) {
    if (cool_down.skill.name == selected_skill.name)
      throw "Oops: selected skill was on cool down!";
  }

  var do_next_turn = false;

  if (selected_skill.aoe) {
    for (var mob of mobs) {
      ApplySkillToCharacter(mob, selected_skill);
      MaybeApplySkillAsDebufToCharacter(mob, selected_skill);
    }
    MaybeApplySkillToCharacter(player, selected_skill);
    do_next_turn = true;
  } else {
    // Find the target character
    var target_character;
    var target_character_index = player.target_character_index;
    if (target_character_index < 0 || selected_skill.self_only) {
      target_character = player;
      target_character_index = active_character_index;
    } else {
      target_character = GetCharacter(target_character_index);
    }
    if (selected_skill.IsDamagingSkill() &&
        target_character_index == active_character_index) {
      console.log("Cannot apply skill to self.");
    } else {
      ApplySkillToCharacter(target_character, selected_skill);
      MaybeApplySkillAsDebufToCharacter(target_character, selected_skill);
      MaybeApplySkillToCharacter(player, selected_skill);
      do_next_turn = true;
    }
  }

  if (do_next_turn)
    NextTurn();

  RebuildUI();
}

function ApplySkillToCharacter(character, skill) {
  // Apply damaging effects
  if (skill.IsDamagingSkill()) {
    var damage;
    if (skill.damage_lower == skill.damage_upper) {
      damage = skill.damage_lower;
    } else {
      // Compute damage given roll of dice.
      damage = Math.trunc(skill.damage_lower + (skill.damage_upper - skill.damage_lower) * Math.random());
    }

    console.log(skill.name + " hits " + character.name + " for " + damage + "hp.");
    character.hp -= damage;

    if (character.hp < 0) {
      console.log(character.name + " is dead.");
      character.hp = 0;  // Dead
    } 
  }

  // Apply healing effects
  if (skill.healing > 0) {
    var healing;
    var max_hp = character.character_class.hp;
    if (!skill.extends_hp && character.hp + skill.healing > max_hp) {
      healing = max_hp - character.hp;
    } else {
      healing = skill.healing;
    }
    console.log(skill.name + " heals " + character.name + " for " + healing + "hp.");
    character.hp += healing;
  }
}

function MaybeApplySkillAsDebufToCharacter(character, skill) {
  if (skill.is_debuf && skill.duration > 1) {
    // Overwrite existing version of the same skill.
    for (var debuf of character.debufs) {
      if (debuf.skill.name == skill.name) {
        debuf.duration = skill.duration - 1;
        return;
      }
    }
    character.debufs.push(new Debuf(skill, skill.duration - 1));
  }
}

function MaybeApplySkillToCharacter(character, skill) {
  if (skill.is_multi_turn_action)
    character.current_action = new Action(skill, skill.duration - 1);
  if (skill.cool_down > 0)
    character.cool_downs.push(new CoolDown(skill, skill.cool_down));
}

function GetCoolDown(character, skill) {
  for (var cool_down of character.cool_downs) {
    if (cool_down.skill.name == skill.name)
      return cool_down;
  }
  return null;
}

function DoSetTargetCharacterIndex() {
  var input = event.target;

  console.log("DoSetTargetCharacterIndex: " + input.value);

  var total_players = players.length;
  var total_mobs = mobs.length;
  var total_characters = total_players + total_mobs;

  var new_index = input.value;
  if (new_index < total_characters && new_index >= 0) {
    var player = players[active_character_index];
    player.target_character_index = input.value;
  } else {
    player.target_character_index = -1;
  }

  RebuildUI();
}

function DoMobTurn() {
  var input = event.target;

  console.log("DoMobTurn");

  var total_players = players.length;
  var total_mobs = mobs.length;
  var total_characters = total_players + total_mobs;

  var mob = mobs[active_character_index - total_players];

  // Process any debufs

  for (var debuf of mob.debufs) {
    ApplySkillToCharacter(mob, debuf.skill);
    debuf.duration--;
  }

  for (var debuf of mob.debufs) {
    if (debuf.duration > 0) {
      ApplySkillToCharacter(mob, debuf.skill);
      debuf.duration--;
    }
  }

  if (mob.hp == 0) {
    // Mob died from application of debufs.
    NextTurn();
  } else {
    // Find target player
    var target_player = players[mob.target_character_index];
    if (target_player.hp == 0) {
      console.log("Target is a dead player.");
    } else {
      // Just use the first skill for now.
      ApplySkillToCharacter(target_player, mob.character_class.skills[0]);
      NextTurn();
    }
  }

  RebuildUI();
}
