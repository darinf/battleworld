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
