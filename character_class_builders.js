// Player classes:
// 
// Warrior
// HP: 250
// Skills:
//  Slam: 30 damage
//  Last Stand: 100 hp (cooldown: 10 turns)
//  Sword Tornado: 10 AOE damage for 3 turns
//  Level 2:
//   Ignore Pain: reduces damage by 50% for 4 turns
//   Taunt: gives warrior max threat for target mob
//  Level 3:
//   Sweeping Strikes: next 3 attacks also hit all nearby mobs
//
// Paladin
// HP: 200
// Skills:
//  Judgement: 30 damage
//  Consecration: 10 AOE damage for 5 turns
//  Flash of light: 50 hp (cast time: 1 turn)
//  Level 2:
//   Light of the Protector: 40 hp (cooldown: 2 turns)
//   Divine Shield: prevents all damage done to you for 3 turns (cooldown: 15 turns)
//  Level 3:
//   Avenger's Shield: hits up to 2 additional mobs after the target mob for 25 hp (cooldown: 1 turn) and silences mobs for 1 turn
//
// Wizard
// HP: 100
// Skills:
//  Arcane Shield: 100 hp (cooldown: 3 turns)
//  Fire Blast: 50 damage
//  Blizzard: 20 AOE damage for 5 turns
//  Level 2:
//   Arcane Blast: 120 damage (cast time: 1 turn)
//   Frost Nova: AOE prevents all mobs from attacking for 1 turn (cooldown: 5 turns)
//  Level 3:
//   Polymorph: prevents mob from attacking for 2 turns (cast time: 1 turn)
//
// Priest
// HP: 100
// Skills:
//  Smite: 40 damage
//  Flash Heal: 70 hp (cast time: 1 turn)
//  Renew: 10 healing for 5 turns
//  Level 2:
//   Holy Nova: 20 AOE healing instantly
//   Power Word - Shield: places shield on friendly target for 120 hp (cooldown: 2 turns)
//  Level 3:
//   Resurrection: brings target player back to life w/ half hp (cast time: 2 turns)
//

function BuildWarriorClass() {
  let new_class = new CharacterClass("warrior", 250);
  new_class.threat_modifier = 1.5;

  let slam = new Skill("Slam");
  slam.damage_lower = 30;
  slam.damage_upper = 30;
  new_class.skills.push(slam);

  let last_stand = new Skill("Last Stand");
  last_stand.healing = 100;
  last_stand.cool_down = 10;
  last_stand.self_only = true;
  last_stand.extends_hp = true;
  new_class.skills.push(last_stand);

  let sword_tornado = new Skill("Sword Tornado");
  sword_tornado.damage_lower = 10;
  sword_tornado.damage_upper = 10;
  sword_tornado.aoe = true;
  sword_tornado.duration = 3;
  sword_tornado.is_channeled = true;
  new_class.skills.push(sword_tornado);

	return new_class;
}

function BuildPaladinClass() {
  let new_class = new CharacterClass("paladin", 200);

  let judgement = new Skill("Judgement");
  judgement.damage_lower = 30;
  judgement.damage_upper = 30;
  new_class.skills.push(judgement);

  let consecration = new Skill("Consecration");
  consecration.damage_lower = 10;
  consecration.damage_upper = 10;
  consecration.duration = 5;
  consecration.aoe = true;
  consecration.is_debuf = true;  // Hack
  new_class.skills.push(consecration);

  let flash_of_light = new Skill("Flash of Light");
  flash_of_light.healing = 50;
  flash_of_light.cast_time = 1;
  new_class.skills.push(flash_of_light);

	return new_class;
}

function BuildWizardClass() {
  let new_class = new CharacterClass("wizard", 100);

  let arcane_shield = new Skill("Arcane Shield");
  arcane_shield.healing = 100;
  arcane_shield.cool_down = 3;
  arcane_shield.extends_hp = true;
  new_class.skills.push(arcane_shield);

  let fire_blast = new Skill("Fire Blast");
  fire_blast.damage_lower = 50;
  fire_blast.damage_upper = 50;
  new_class.skills.push(fire_blast);

  let blizzard = new Skill("Blizzard");
  blizzard.damage_lower = 20;
  blizzard.damage_upper = 20;
  blizzard.duration = 5;
  blizzard.aoe = true;
  blizzard.is_channeled = true;
  new_class.skills.push(blizzard);

	return new_class;
}

function BuildPriestClass() {
  let new_class = new CharacterClass("priest", 100);

  let smite = new Skill("Smite");
  smite.damage_lower = 40;
  smite.damage_upper = 40;
  new_class.skills.push(smite);

  let flash_heal = new Skill("Flash Heal");
  flash_heal.healing = 70;
  flash_heal.cast_time = 1;
  new_class.skills.push(flash_heal);

	let renew = new Skill("Renew");
	renew.healing = 10;
	renew.duration = 5;
  new_class.skills.push(renew);

	return new_class;
}

function NewBasicClass(name, hp, damage_lower, damage_upper) {
  let new_class = new CharacterClass(name, hp);

  let strike = new Skill("Strike");
  strike.damage_lower = damage_lower;
  strike.damage_upper = damage_upper;
  new_class.skills.push(strike);

  return new_class;
}
