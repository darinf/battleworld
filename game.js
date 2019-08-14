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
  {name: "Abomination", hp: 500, damage: [25, 115]},
  {name: "Naga Behemoth", hp: 750, damage: [20, 100]},
  {name: "Fel Lord", hp: 1000, damage: [30, 180]},
];

function GetMobClass(name) {
  for (let mob of g_basic_mob_types) {
    if (mob.name == name)
      return NewBasicClass(mob.name, mob.hp, mob.damage[0], mob.damage[1]);
  }
  return null;
}

function DoInitialize() {
  const kClassBuilders = [
    BuildPaladinClass,
    BuildPriestClass,
    BuildWarriorClass,
    BuildWizardClass,
  ];
  for (let f of kClassBuilders)
    g_player_classes.push(f());

  g_battle = new Battle();

  RebuildUI();
}

let g_battle = null;

function DoAddPlayer() {
  let dialog = document.getElementById("add_player_dialog");
  let class_select = dialog.getElementsByTagName("select")[0];
  let name_input = dialog.getElementsByTagName("input")[0];

  // Build out the set of options dynamically.
  class_select.innerHTML = "";
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

    g_battle.AddPlayer(new Player(player_name, GetPlayerClass(class_name)));

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

    g_battle.AddMob(new Mob(type_name, GetMobClass(type_name)));

    RebuildUI();
  };

  dialog.showModal();
}

function ShowGameOverDialog(dialog_id) {
  let dialog = document.getElementById(dialog_id);
  dialog.onclose = function() { location.reload(); }
  dialog.showModal();
}

function RebuildUI() {
  let players_div = document.getElementById("players");
  let mobs_div = document.getElementById("mobs");

  let character_index = 0;

  // Get the target character index of the active character.
  let target_character_index = g_battle.GetTargetCharacterIndex();

  // players:

  players_div.innerHTML = "<b>Players</b>";

  for (let player of g_battle.players) {
    let div = document.createElement("DIV");

    if (character_index == g_battle.active_character_index)
      div.setAttribute("class", "character_box active_character");
    else
      div.setAttribute("class", "character_box");

		let target_div = document.createElement("DIV");
    target_div.setAttribute("onclick", "DoSetTargetCharacterIndex(" + character_index + ")");
		if (character_index == target_character_index)
			target_div.setAttribute("class", "target_div target_character");
		else
			target_div.setAttribute("class", "target_div");
		div.appendChild(target_div);

    div.appendChild(document.createTextNode( 
        "[" + character_index + "] " + player.name + " (" + player.hp + "hp) "));
        
    for (let skill of player.character_class.skills) {
      let input = document.createElement("INPUT");
      input.setAttribute("type", "button");
      input.setAttribute("onclick", "DoSkill()");

      let cool_down = player.GetCoolDown(skill);
      if (cool_down) {
        input.setAttribute("value", skill.name + " (" + cool_down.duration + ")");
      } else {
        input.setAttribute("value", skill.name);
      }

      if (character_index != g_battle.active_character_index || player.hp == 0 || cool_down)
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
      if (character_index != g_battle.active_character_index)
        input.setAttribute("disabled", "true");
      div.appendChild(input);
    }

    players_div.appendChild(div);

    character_index++;
  }

  // mobs:

  mobs_div.innerHTML = "<b>Mobs</b>";

  for (let mob of g_battle.mobs) {
    let div = document.createElement("DIV");

    if (character_index == g_battle.active_character_index)
      div.setAttribute("class", "character_box active_character");
    else
      div.setAttribute("class", "character_box");

		let target_div = document.createElement("DIV");
    target_div.setAttribute("onclick", "DoSetTargetCharacterIndex(" + character_index + ")");
		if (character_index == target_character_index)
			target_div.setAttribute("class", "target_div target_character");
		else
			target_div.setAttribute("class", "target_div");
		div.appendChild(target_div);

    div.appendChild(document.createTextNode(
        "[" + character_index + "] " + mob.name + " (" + mob.hp + "hp) "));

    let input = document.createElement("INPUT");
    input.setAttribute("type", "button");
    input.setAttribute("value", "Take turn");
    input.setAttribute("onclick", "DoMobTurn()");
    if (character_index != g_battle.active_character_index || mob.hp == 0)
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

  if (g_battle.active_character_index == -1) {
    add_player_button.removeAttribute("disabled");
    add_mob_button.removeAttribute("disabled");
    if (g_battle.players.length == 0 || g_battle.mobs.length == 0) {
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

	g_battle.Start(DidEndBattle);

  RebuildUI();
}

function DidEndBattle(players_won) {
  ShowGameOverDialog(players_won ? "game_over_win" : "game_over_lose");
}

function DoSkipTurn() {
  console.log("Skip turn! {{{");

	g_battle.DoSkipTurn();

	console.log("}}}");

  RebuildUI();
}

function DoSkill() {
  let input = event.target;

  console.log("DoSkill: " + input.value + " {{{");
  let selected_skill_name = input.value;

	g_battle.DoSkill(selected_skill_name);

	console.log("}}}");

  RebuildUI();
}

function DoSetTargetCharacterIndex(index) {
  console.log("DoSetTargetCharacterIndex: " + index);
	g_battle.SetTargetCharacterIndex(index);
  RebuildUI();
}

function DoMobTurn() {
  console.log("DoMobTurn: " + g_battle.active_character_index + " {{{");
	g_battle.DoMobTurn();
	console.log("}}}");
  RebuildUI();
}
