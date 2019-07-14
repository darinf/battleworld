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
    this.is_channeled = false;
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
  constructor(skill, target_characters, duration) {
    this.skill = skill;
    this.target_characters = target_characters;
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

let warrior_class = null;
let paladin_class = null;
let wizard_class = null;

function BuildWarriorClass() {
  warrior_class = new CharacterClass("warrior", 250);

  let slam = new Skill("Slam");
  slam.damage_lower = 30;
  slam.damage_upper = 30;
  warrior_class.skills.push(slam);

  let last_stand = new Skill("Last Stand");
  last_stand.healing = 100;
  last_stand.cool_down = 10;
  last_stand.self_only = true;
  last_stand.extends_hp = true;
  warrior_class.skills.push(last_stand);

  let sword_tornado = new Skill("Sword Tornado");
  sword_tornado.damage_lower = 10;
  sword_tornado.damage_upper = 10;
  sword_tornado.aoe = true;
  sword_tornado.duration = 3;
  sword_tornado.is_channeled = true;
  warrior_class.skills.push(sword_tornado);
}

function BuildPaladinClass() {
  paladin_class = new CharacterClass("paladin", 200);

  let judgement = new Skill("Judgement");
  judgement.damage_lower = 30;
  judgement.damage_upper = 30;
  paladin_class.skills.push(judgement);

  let consecration = new Skill("Consecration");
  consecration.damage_lower = 10;
  consecration.damage_upper = 10;
  consecration.duration = 5;
  consecration.aoe = true;
  consecration.is_debuf = true;  // Hack
  paladin_class.skills.push(consecration);

  let flash_of_light = new Skill("Flash of Light");
  flash_of_light.healing = 50;
  flash_of_light.cast_time = 1;
  flash_of_light.is_channeled = false;
  paladin_class.skills.push(flash_of_light);
}

function BuildWizardClass() {
  wizard_class = new CharacterClass("wizard", 100);

  let arcane_shield = new Skill("Arcane Shield");
  arcane_shield.healing = 100;
  arcane_shield.cool_down = 3;
  arcane_shield.extends_hp = true;
  wizard_class.skills.push(arcane_shield);

  let fire_blast = new Skill("Fire Blast");
  fire_blast.damage_lower = 50;
  fire_blast.damage_upper = 50;
  wizard_class.skills.push(fire_blast);

  let blizzard = new Skill("Blizzard");
  blizzard.damage_lower = 20;
  blizzard.damage_upper = 20;
  blizzard.duration = 5;
  blizzard.aoe = true;
  blizzard.is_channeled = true;
  wizard_class.skills.push(blizzard);

}

function NewBasicClass(name, hp, damage_lower, damage_upper) {
  let new_class = new CharacterClass(name, hp);

  let strike = new Skill("Strike");
  strike.damage_lower = damage_lower;
  strike.damage_upper = damage_upper;
  new_class.skills.push(strike);

  return new_class;
}

function GetPlayerClass(name) {
  switch (name.toLowerCase()) {
    case paladin_class.name:
      return paladin_class;
    case warrior_class.name:
      return warrior_class;
    case wizard_class.name:
      return wizard_class;
  }
  return null;
}

let basic_mobs = [
  {name: "Naga", hp: 100, damage: [10, 60]},
  {name: "Imp", hp: 50, damage: [5, 30]},
  {name: "Demon", hp: 200, damage: [15, 90]},
  {name: "Scourge Soldier", hp: 150, damage: [10, 60]},
];

function GetMobClass(name) {
  for (let mob of basic_mobs) {
    if (mob.name == name)
      return NewBasicClass(mob.name, mob.hp, mob.damage[0], mob.damage[1]);
  }
  return null;
}

function Initialize() {
  BuildWarriorClass();
  BuildPaladinClass();
  BuildWizardClass();
  RebuildUI();
}

let players = [];
let mobs = [];
let active_character_index = -1;

function AddPlayer() {
  let dialog = document.getElementById("add_player_dialog");
  let class_select = dialog.getElementsByTagName("select")[0];
  let name_input = dialog.getElementsByTagName("input")[0];

  dialog.onclose = function() {
    console.log("selected: " + class_select.value + ", " + name_input.value);

    if (dialog.returnValue == "cancel")
      return;

    let player_name = name_input.value;
    let class_name = class_select.value;

    players.push(new Character(player_name, GetPlayerClass(class_name)));

    RebuildUI();
  };

  dialog.showModal();
}

function AddMob() {
  let dialog = document.getElementById("add_mob_dialog");
  let type_select = dialog.getElementsByTagName("select")[0];

  // Build out the set of options dynamically.
  type_select.innerHTML = "";
  for (let mob of basic_mobs) {
    let option = document.createElement("OPTION");
    option.appendChild(document.createTextNode(mob.name));
    type_select.appendChild(option);
  }

  dialog.onclose = function() {
    console.log("selected: " + type_select.value);

    if (dialog.returnValue == "cancel")
      return;

    let type_name = type_select.value;

    mobs.push(new Character(type_name, GetMobClass(type_name)));

    RebuildUI();
  };

  dialog.showModal();
}

function ShowYouWinDialog() {
  let dialog = document.getElementById("game_over_win");

  dialog.onclose = function() {
    location.reload();
    RebuildUI();
  }

  dialog.showModal();
}

function ShowYouLoseDialog() {
  let dialog = document.getElementById("game_over_lose");

  dialog.onclose = function() {
    location.reload();
    RebuildUI();
  }

  dialog.showModal();
}

function RebuildUI() {
  let players_div = document.getElementById("players");
  let mobs_div = document.getElementById("mobs");

  let character_index = 0;

  // players:

  players_div.innerHTML = "<b>Players</b>";

  for (let player of players) {
    let div = document.createElement("DIV");

    if (character_index == active_character_index)
      div.setAttribute("class", "character_box active_character");
    else
      div.setAttribute("class", "character_box");

    div.innerHTML = 
        "[" + character_index + "] " + player.name + " (" + player.hp + "hp) " +
        " target: ";

    let input = document.createElement("INPUT");
    input.setAttribute("value", player.target_character_index);
    input.setAttribute("onchange", "DoSetTargetCharacterIndex()");
    if (character_index != active_character_index)
      input.setAttribute("disabled", "true");
    div.appendChild(input);
        
    for (let skill of player.character_class.skills) {
      let input = document.createElement("INPUT");
      input.setAttribute("type", "button");
      input.setAttribute("onclick", "DoSkill()");

      let cool_down = GetCoolDown(player, skill);
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
      let input = document.createElement("INPUT");
      input.setAttribute("type", "button");
      input.setAttribute("onclick", "SkipTurn()");
      input.setAttribute("value", "Continue");
      if (character_index != active_character_index)
        input.setAttribute("disabled", "true");
      div.appendChild(input);
    }

    players_div.appendChild(div);

    character_index++;
  }

  // mobs:

  mobs_div.innerHTML = "<b>Mobs</b>";

  for (let mob of mobs) {
    let div = document.createElement("DIV");

    if (character_index == active_character_index)
      div.setAttribute("class", "character_box active_character");
    else
      div.setAttribute("class", "character_box");

    div.innerHTML =
        "[" + character_index + "] " + mob.name + " (" + mob.hp + "hp) " +
        " target: " + mob.target_character_index;

    let input = document.createElement("INPUT");
    input.setAttribute("type", "button");
    input.setAttribute("value", "Take turn");
    input.setAttribute("onclick", "DoMobTurn()");
    if (character_index != active_character_index || mob.hp == 0)
      input.setAttribute("disabled", "true");
    div.appendChild(input);
        
    if (mob.debufs.length > 0) {
      div.appendChild(document.createTextNode("debufs: "));
      for (let debuf of mob.debufs) {
        div.appendChild(
            document.createTextNode(debuf.skill.name + " (" + debuf.duration + ") "));
      }
    }

    mobs_div.appendChild(div);

    character_index++;
  }

  let add_player_button = document.getElementById("add_player_button");
  let add_mob_button = document.getElementById("add_mob_button");
  let battle_button = document.getElementById("battle_button");

  if (active_character_index == -1) {
    add_player_button.removeAttribute("disabled");
    add_mob_button.removeAttribute("disabled");
    if (players.length == 0 || mobs.length == 0) {
      battle_button.setAttribute("disabled", "true");
    } else {
      battle_button.removeAttribute("disabled");
    }
  } else {
    add_player_button.setAttribute("disabled", "true");
    add_mob_button.setAttribute("disabled", "true");
    battle_button.setAttribute("disabled", "true");
  }
}

function Battle() {
  console.log("Battle!");

  active_character_index = 0;

  UpdateTargetOfPlayers();
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
  // Check if game over.
  let any_alive = false;
  for (let player of players) {
    if (player.hp > 0) {
      any_alive = true;
      break;
    }
  }
  if (!any_alive) {
    ShowYouLoseDialog();
    return;
  }

  // Now check for victory.
  any_alive = false;
  for (let mob of mobs) {
    if (mob.hp > 0) {
      any_alive = true;
      break;
    }
  }
  if (!any_alive) {
    ShowYouWinDialog();
    return;
  }

  UpdateCoolDowns(GetCharacter(active_character_index));

  let total_players = players.length;
  let total_mobs = mobs.length;
  let total_characters = total_players + total_mobs;

  active_character_index++;

  // Wrap around if needed.
  if (active_character_index == total_characters)
    active_character_index = 0;

  UpdateTargetOfPlayers();
  UpdateTargetOfMobs();

  if (GetCharacter(active_character_index).hp == 0)
    NextTurn();
}

function UpdateCoolDowns(character) {
  let new_cool_downs = [];
  for (let cool_down of character.cool_downs) {
    cool_down.duration--;
    if (cool_down.duration > 0)
      new_cool_downs.push(cool_down); 
  }
  character.cool_downs = new_cool_downs;
}

function UpdateCurrentAction(character) {
  if (!character.current_action)
    return;

  character.current_action.duration--;

  let skill = character.current_action.skill;
  if (skill.cast_time == 0 || character.current_action.duration == 0) {
    for (let target_character of character.current_action.target_characters) {
      ApplySkillToCharacter(target_character, skill);
    }
  }

  if (character.current_action.duration == 0)
    character.current_action = null;
}

function UpdateTargetOfPlayers() {
  let total_players = players.length;
  let total_mobs = mobs.length;
  let total_characters = total_players + total_mobs;

  // Make sure all players are targeting something (not -1), and if targeting
  // a mob that is already dead, target the next mob automatically.
  
  for (let player of players) {
    if (player.target_character_index == -1) {
      // Target first mob that is not dead.
      for (let index = 0; index < total_mobs; ++index) {
        let mob = mobs[index];
        if (mob.hp > 0) {
          player.target_character_index = total_players + index;
          break;
        }
      }
    } else if (player.target_character_index >= total_players) {
      // If target is a dead mob, advance to next non dead mob. 
      let index = player.target_character_index - total_players;
      let mob = mobs[index];
      while (mob.hp == 0) {
        index = (index + 1) % total_mobs;
        if (index == (player.target_character_index - total_players))
          break;
      }
      player.target_character_index = total_players + index;
    }
  }
}

function UpdateTargetOfMobs() {
  let total_players = players.length;
  let total_mobs = mobs.length;
  let total_characters = total_players + total_mobs;

  // For now, we just always have mobs target the warrior, but we should do
  // something more interesting based on threat calculations.

  let index;

  for (index = 0; index < total_players; ++index) {
    let player = players[index];
    if (player.hp != 0 && player.character_class.name == "Warrior")
      break;
  }
  if (index == total_players) {  // Fallback to first player.
    for (index = 0; index < total_players; ++index) {
      let player = players[index];
      if (player.hp != 0)
        break;
    }
  }

  for (let mob of mobs) {
    if (mob.hp == 0) {
      mob.target_character_index = -1;
    } else {
      mob.target_character_index = index;
    }
  }
}

function GetCharacter(index) {
  let total_players = players.length;
  let total_mobs = mobs.length;
  let total_characters = total_players + total_mobs;

  if (index < 0)
    return null;
  if (index < total_players)
    return players[index];
  if (index < total_characters)
    return mobs[index - total_players];

  return null;
}

function IsPlayer(index) {
  return index >= 0 && index < players.length;
}

function IsMob(index) {
  let total_players = players.length;
  let total_mobs = mobs.length;
  let total_characters = total_players + total_mobs;

  return index >= total_players && index < total_characters;
}

function DoSkill() {
  let input = event.target;

  console.log("DoSkill: " + input.value);
  let selected_skill_name = input.value;

  let active_player = players[active_character_index];

  // Replaces any current action.
  active_player.current_action = null;

  // Find the selected skill
  let selected_skill;
  for (let skill of active_player.character_class.skills) {
    if (skill.name == selected_skill_name)
      selected_skill = skill;
  }

  // If on cool down, then we cannot perform this action now.
  // Should not be reached if on cool down.
  for (let cool_down of active_player.cool_downs) {
    if (cool_down.skill.name == selected_skill.name)
      throw "Oops: selected skill was on cool down!";
  }

  // Build list of targets for the skill.
  let target_characters = [];
  if (selected_skill.aoe) {
    if (selected_skill.healing) {
      for (let player of players) {
        target_characters.push(player);
      }
    } else {
      for (let mob of mobs) {
        target_characters.push(mob);
      }
    }
  } else if (selected_skill.self_only) {
    target_characters.push(active_player);
  } else {
    let target_character_index = active_player.target_character_index;
    if (selected_skill.healing) {
      if (IsPlayer(target_character_index)) {
        target_characters.push(GetCharacter(target_character_index));
      } else {
        target_characters.push(active_player);  // Apply healing skill to self.
      }
    } else {
      if (IsMob(target_character_index))
        target_characters.push(GetCharacter(target_character_index));
    }
  }

  if (target_characters.length == 0) {
    console.log("No target characters for skill!");
  } else {
    if (selected_skill.cast_time == 0) {
      for (let character of target_characters) {
        if (selected_skill.is_debuf) {
          ApplyDebufToCharacter(character, selected_skill);
        } else {
          ApplySkillToCharacter(character, selected_skill);
        }
      }
    }

    if (selected_skill.is_channeled) {
      active_player.current_action = new Action(selected_skill, target_characters, selected_skill.duration - 1);
    } else if (selected_skill.cast_time > 0) {
      active_player.current_action = new Action(selected_skill, target_characters, selected_skill.cast_time);
    }

    if (selected_skill.cool_down > 0)
      active_player.cool_downs.push(new CoolDown(selected_skill, selected_skill.cool_down));

    NextTurn();
  }

  RebuildUI();
}

function ApplySkillToCharacter(character, skill) {
  // Apply damaging effects
  if (skill.IsDamagingSkill()) {
    let damage;
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
    let healing;
    let max_hp = character.character_class.hp;
    if (!skill.extends_hp && character.hp + skill.healing > max_hp) {
      healing = max_hp - character.hp;
    } else {
      healing = skill.healing;
    }
    console.log(skill.name + " heals " + character.name + " for " + healing + "hp.");
    character.hp += healing;
  }
}

function ApplyDebufToCharacter(character, skill) {
  if (!skill.is_debuf)
    throw "Oops: skill is not a debuf!";

  // Overwrite existing version of the same skill.
  for (let debuf of character.debufs) {
    if (debuf.skill.name == skill.name) {
      debuf.duration = skill.duration;
      return;
    }
  }
  character.debufs.push(new Debuf(skill, skill.duration));
}

function GetCoolDown(character, skill) {
  for (let cool_down of character.cool_downs) {
    if (cool_down.skill.name == skill.name)
      return cool_down;
  }
  return null;
}

function DoSetTargetCharacterIndex() {
  let input = event.target;

  console.log("DoSetTargetCharacterIndex: " + input.value);

  let total_players = players.length;
  let total_mobs = mobs.length;
  let total_characters = total_players + total_mobs;

  let new_index = input.value;
  if (new_index < total_characters && new_index >= 0) {
    let player = players[active_character_index];
    player.target_character_index = input.value;
  } else {
    player.target_character_index = -1;
  }

  RebuildUI();
}

function DoMobTurn() {
  let input = event.target;

  console.log("DoMobTurn");

  let total_players = players.length;
  let total_mobs = mobs.length;
  let total_characters = total_players + total_mobs;

  let mob = mobs[active_character_index - total_players];

  // Process any debufs

  let remaining_debufs = [];
  for (let debuf of mob.debufs) {
    ApplySkillToCharacter(mob, debuf.skill);
    if (--debuf.duration > 0)
      remaining_debufs.push(debuf);
  }
  mob.debufs = remaining_debufs;

  if (mob.hp == 0) {
    // Mob died from application of debufs.
    NextTurn();
  } else {
    // Find target player
    let target_player = players[mob.target_character_index];
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
