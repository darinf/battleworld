// game.js

let g_player_classes = [];

function GetPlayerClass(class_name) {
	let lower_class_name = class_name.toLowerCase();
	for (let i = 0; i < g_player_classes.length; ++i) {
		if (lower_class_name == g_player_classes[i].name)
			return g_player_classes[i];
	}
  return null;
}

let g_basic_mob_types = [
  {name: "Naga", hp: 100, damage: [10, 60]},
  {name: "Imp", hp: 50, damage: [5, 30]},
  {name: "Demon", hp: 200, damage: [15, 90]},
  {name: "Scourge Soldier", hp: 150, damage: [10, 60]},
];

function GetMobClass(name) {
  for (let mob of g_basic_mob_types) {
    if (mob.name == name)
      return NewBasicClass(mob.name, mob.hp, mob.damage[0], mob.damage[1]);
  }
  return null;
}

function Initialize() {
	const kClassBuilders = [
		BuildPaladinClass,
		BuildPriestClass,
		BuildWarriorClass,
		BuildWizardClass,
	];
	for (let f of kClassBuilders)
		g_player_classes.push(f());

  RebuildUI();
}

let g_players = [];
let g_mobs = [];
let g_active_character_index = -1;

function DoAddPlayer() {
  let dialog = document.getElementById("add_player_dialog");
  let class_select = dialog.getElementsByTagName("select")[0];
  let name_input = dialog.getElementsByTagName("input")[0];

	for (let player_class of g_player_classes) {
		let option = document.createElement("OPTION");
    option.appendChild(document.createTextNode(player_class.name));
    class_select.appendChild(option);
	}

  dialog.onclose = function() {
    console.log("selected: " + class_select.value + ", " + name_input.value);

    if (dialog.returnValue == "cancel")
      return;

    let player_name = name_input.value;
    let class_name = class_select.value;

    g_players.push(new Character(player_name, GetPlayerClass(class_name)));

    RebuildUI();
  };

  dialog.showModal();
}

function DoAddMob() {
  let dialog = document.getElementById("add_mob_dialog");
  let type_select = dialog.getElementsByTagName("select")[0];

  // Build out the set of options dynamically.
  type_select.innerHTML = "";
  for (let mob_type of g_basic_mob_types) {
    let option = document.createElement("OPTION");
    option.appendChild(document.createTextNode(mob_type.name));
    type_select.appendChild(option);
  }

  dialog.onclose = function() {
    console.log("selected: " + type_select.value);

    if (dialog.returnValue == "cancel")
      return;

    let type_name = type_select.value;

    g_mobs.push(new Character(type_name, GetMobClass(type_name)));

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

  for (let player of g_players) {
    let div = document.createElement("DIV");

    if (character_index == g_active_character_index)
      div.setAttribute("class", "character_box active_character");
    else
      div.setAttribute("class", "character_box");

    div.innerHTML = 
        "[" + character_index + "] " + player.name + " (" + player.hp + "hp) " +
        " target: ";

    let input = document.createElement("INPUT");
    input.setAttribute("value", player.target_character_index);
    input.setAttribute("onchange", "DoSetTargetCharacterIndex()");
    if (character_index != g_active_character_index)
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

      if (character_index != g_active_character_index || player.hp == 0 || cool_down)
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
      input.setAttribute("onclick", "DoSkipTurn()");
      input.setAttribute("value", "Continue");
      if (character_index != g_active_character_index)
        input.setAttribute("disabled", "true");
      div.appendChild(input);
    }

    players_div.appendChild(div);

    character_index++;
  }

  // mobs:

  mobs_div.innerHTML = "<b>Mobs</b>";

  for (let mob of g_mobs) {
    let div = document.createElement("DIV");

    if (character_index == g_active_character_index)
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
    if (character_index != g_active_character_index || mob.hp == 0)
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

  if (g_active_character_index == -1) {
    add_player_button.removeAttribute("disabled");
    add_mob_button.removeAttribute("disabled");
    if (g_players.length == 0 || g_mobs.length == 0) {
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

function DoStartBattle() {
  console.log("Battle!");

  g_active_character_index = 0;

  UpdateTargetOfPlayers();
  UpdateTargetOfMobs();
  RebuildUI();
}

function DoSkipTurn() {
  console.log("Skip turn!");

  UpdateCurrentAction(GetCharacter(g_active_character_index));

  NextTurn();
  RebuildUI();
}

function NextTurn() {
  // Check if game over.
  let any_alive = false;
  for (let player of g_players) {
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
  for (let mob of g_mobs) {
    if (mob.hp > 0) {
      any_alive = true;
      break;
    }
  }
  if (!any_alive) {
    ShowYouWinDialog();
    return;
  }

  UpdateCoolDowns(GetCharacter(g_active_character_index));

  let total_players = g_players.length;
  let total_mobs = g_mobs.length;
  let total_characters = total_players + total_mobs;

  g_active_character_index++;

  // Wrap around if needed.
  if (g_active_character_index == total_characters)
    g_active_character_index = 0;

  UpdateTargetOfPlayers();
  UpdateTargetOfMobs();

  if (GetCharacter(g_active_character_index).hp == 0)
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
  let total_players = g_players.length;
  let total_mobs = g_mobs.length;
  let total_characters = total_players + total_mobs;

  // Make sure all players are targeting something (not -1), and if targeting
  // a mob that is already dead, target the next mob automatically.
  
  for (let player of g_players) {
    if (player.target_character_index == -1) {
      // Target first mob that is not dead.
      for (let index = 0; index < total_mobs; ++index) {
        let mob = g_mobs[index];
        if (mob.hp > 0) {
          player.target_character_index = total_players + index;
          break;
        }
      }
    } else if (player.target_character_index >= total_players) {
      // If target is a dead mob, advance to next non dead mob. 
      let index = player.target_character_index - total_players;
      let mob = g_mobs[index];
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
  let total_players = g_players.length;
  let total_mobs = g_mobs.length;
  let total_characters = total_players + total_mobs;

  // For now, we just always have mobs target the warrior, but we should do
  // something more interesting based on threat calculations.

  let index;

  for (index = 0; index < total_players; ++index) {
    let player = g_players[index];
    if (player.hp != 0 && player.character_class.name == "Warrior")
      break;
  }
  if (index == total_players) {  // Fallback to first player.
    for (index = 0; index < total_players; ++index) {
      let player = g_players[index];
      if (player.hp != 0)
        break;
    }
  }

  for (let mob of g_mobs) {
    if (mob.hp == 0) {
      mob.target_character_index = -1;
    } else {
      mob.target_character_index = index;
    }
  }
}

function GetCharacter(index) {
  let total_players = g_players.length;
  let total_mobs = g_mobs.length;
  let total_characters = total_players + total_mobs;

  if (index < 0)
    return null;
  if (index < total_players)
    return g_players[index];
  if (index < total_characters)
    return g_mobs[index - total_players];

  return null;
}

function IsPlayer(index) {
  return index >= 0 && index < g_players.length;
}

function IsMob(index) {
  let total_players = g_players.length;
  let total_mobs = g_mobs.length;
  let total_characters = total_players + total_mobs;

  return index >= total_players && index < total_characters;
}

function DoSkill() {
  let input = event.target;

  console.log("DoSkill: " + input.value + " {{{");
  let selected_skill_name = input.value;

  let active_player = g_players[g_active_character_index];

  console.log("active player is " + active_player.name);

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
      for (let player of g_players) {
        target_characters.push(player);
      }
    } else {
      for (let mob of g_mobs) {
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

	console.log("}}}");

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

  let total_players = g_players.length;
  let total_mobs = g_mobs.length;
  let total_characters = total_players + total_mobs;

  let new_index = input.value;
  if (new_index < total_characters && new_index >= 0) {
    let player = g_players[g_active_character_index];
    player.target_character_index = input.value;
  } else {
    player.target_character_index = -1;
  }

  RebuildUI();
}

function DoMobTurn() {
  let input = event.target;

  console.log("DoMobTurn: " + g_active_character_index + " {{{");

  let total_players = g_players.length;
  let total_mobs = g_mobs.length;
  let total_characters = total_players + total_mobs;

  let mob = g_mobs[g_active_character_index - total_players];

  console.log("active mob is " + mob.name);

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
    let target_player = g_players[mob.target_character_index];
    if (target_player.hp == 0) {
      console.log("Target is a dead player.");
    } else {
      // Just use the first skill for now.
      ApplySkillToCharacter(target_player, mob.character_class.skills[0]);
      NextTurn();
    }
  }

	console.log("}}}");

  RebuildUI();
}
