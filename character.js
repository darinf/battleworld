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
  constructor(source_character, skill, duration) {
    this.source_character = source_character;
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

	GetCoolDown(skill) {
		for (let cool_down of this.cool_downs) {
			if (cool_down.skill.name == skill.name)
				return cool_down;
		}
		return null;
	}
}

class Player extends Character {
  constructor(name, character_class) {
    super(name, character_class);
  }
}

class ThreatTable {
  constructor() {
    this.list_ = new Array();  // Array of { threat: N, player: P }
  }

  Add(threat, player) {
    let entry = this.Find_(player);
    if (entry) {
      entry.threat += threat;
    } else {
      entry = this.Push_(threat, player);
    }
    this.Resort_();
  }

  Drop(player) {
    for (let i = 0; i < this.list_.length; ++i) {
      if (this.list_[i].player == player) {
        this.list_.splice(i, 1);
        break;
      }
    }
  }

  Top() {
    return this.list_.length > 0 ? this.list_[0] : null;
  }

  Find_(player) {
    for (let entry of this.list_) {
      if (entry.player == player)
        return entry;
    }
    return null;
  }

  Push_(threat, player) {
    this.list_.push({threat: threat, player: player});
  }

  Resort_() {
    this.list_.sort(function(a, b) {
      // Sort in descending order, so top threat is element 0 in the list.
      return b.threat - a.threat;
    });
  }
}

class Mob extends Character {
  constructor(name, character_class) {
    super(name, character_class);
    this.threat_table_ = new ThreatTable();
  }

  AddThreat(threat, player) {
    this.threat_table_.Add(threat, player);
  }

  DropThreat(player) {
    this.threat_table_.Drop(player);
  }
}
