// Represents a set of players confronting a set of mobs and the state associated
// with their battle as well as the methods to execute the turns of the battle.
//
// The battle has a notion of active character (player or mob) that will take the
// next turn.
//
class Battle {
	constructor() {
		this.players_ = [];
		this.mobs_ = [];
		this.active_character_index_ = -1;
		this.game_over_callback_ = null;
	}

	get players() {
		return this.players_;
	}

	get mobs() {
		return this.mobs_;
	}

	get active_character_index() {
		return this.active_character_index_;
	}

	AddPlayer(player) {
		this.players_.push(player);
	}

	AddMob(mob) {
		this.mobs_.push(mob);
	}

	Start(game_over_callback) {
		this.game_over_callback_ = game_over_callback;
		this.active_character_index_ = 0;
    this.UpdateTargetOfPlayers_();
    this.UpdateTargetOfMobs_();
	}

	SetTargetCharacterIndex(new_index) {
		let total_players = this.players_.length;
		let total_mobs = this.mobs_.length;
		let total_characters = total_players + total_mobs;

    if (!this.IsPlayer_(this.active_character_index_)) {
      console.log("Cannot set target index of non-player characters!");
      return;
    }

		if (new_index < total_characters && new_index >= 0) {
			let player = this.players_[this.active_character_index_];
			player.target_character_index = new_index;
		} else {
		  console.log("Invalid character index!");
		}
	}

	GetTargetCharacterIndex() {
		let character = this.GetCharacter_(this.active_character_index_);
    return character ? character.target_character_index : -1;
	}

	DoSkill(skill_name) {
		let active_player = this.players_[this.active_character_index_];

		console.log("active player is " + active_player.name);

		// Replaces any current action.
		active_player.current_action = null;

		// Find the selected skill
		let selected_skill;
		for (let skill of active_player.character_class.skills) {
			if (skill.name == skill_name)
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
				for (let player of this.players_) {
					target_characters.push(player);
				}
			} else {
				for (let mob of this.mobs_) {
					target_characters.push(mob);
				}
			}
		} else if (selected_skill.self_only) {
			target_characters.push(active_player);
		} else {
			let target_character_index = active_player.target_character_index;
			if (selected_skill.healing) {
				if (this.IsPlayer_(target_character_index)) {
					target_characters.push(this.GetCharacter_(target_character_index));
				} else {
					target_characters.push(active_player);  // Apply healing skill to self.
				}
			} else {
				if (this.IsMob_(target_character_index))
					target_characters.push(this.GetCharacter_(target_character_index));
			}
		}

		if (target_characters.length == 0) {
			console.log("No target characters for skill!");
		} else {
			if (selected_skill.cast_time == 0) {
				for (let character of target_characters) {
					if (selected_skill.is_debuf) {
						this.ApplyDebufToCharacter_(character, selected_skill);
					} else {
						this.ApplySkillToCharacter_(character, selected_skill);
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

			this.NextTurn_();
		}
	}

	DoSkipTurn() {
    this.UpdateCurrentAction_(this.GetCharacter_(this.active_character_index_));
    this.NextTurn_();
	}

	DoMobTurn() {
		let total_players = this.players_.length;
		let total_mobs = this.mobs_.length;
		let total_characters = total_players + total_mobs;

		let mob = this.mobs_[this.active_character_index_ - total_players];

		console.log("active mob is " + mob.name);

		// Process any debufs

		let remaining_debufs = [];
		for (let debuf of mob.debufs) {
			this.ApplySkillToCharacter_(mob, debuf.skill);
			if (--debuf.duration > 0)
				remaining_debufs.push(debuf);
		}
		mob.debufs = remaining_debufs;

		if (mob.hp == 0) {
			// Mob died from application of debufs.
			this.NextTurn_();
		} else {
			// Find target player
			let target_player = this.players_[mob.target_character_index];
			if (target_player.hp == 0) {
				console.log("Target is a dead player.");
			} else {
				// Just use the first skill for now.
				this.ApplySkillToCharacter_(target_player, mob.character_class.skills[0]);
				this.NextTurn_();
			}
		}
	}

	// private:

  NextTurn_() {
		// Check if game over.
		let any_players_alive = false;
		for (let player of this.players_) {
			if (player.hp > 0) {
				any_players_alive = true;
				break;
			}
		}
		if (!any_players_alive) {
			this.game_over_callback_(false);
			return;
		}

		// Now check for victory.
		let any_mobs_alive = false;
		for (let mob of this.mobs_) {
			if (mob.hp > 0) {
				any_mobs_alive = true;
				break;
			}
		}
		if (!any_mobs_alive) {
			this.game_over_callback_(true);
			return;
		}

		this.UpdateCoolDowns_(this.GetCharacter_(this.active_character_index_));

		let total_players = this.players_.length;
		let total_mobs = this.mobs_.length;
		let total_characters = total_players + total_mobs;

		this.active_character_index_++;

		// Wrap around if needed.
		if (this.active_character_index_ == total_characters)
			this.active_character_index_ = 0;

		this.UpdateTargetOfPlayers_();
		this.UpdateTargetOfMobs_();

		if (this.GetCharacter_(this.active_character_index_).hp == 0)
			this.NextTurn_();
	}

	UpdateTargetOfPlayers_() {
		let total_players = this.players_.length;
		let total_mobs = this.mobs_.length;
		let total_characters = total_players + total_mobs;

		// Make sure all players are targeting something (not -1), and if targeting
		// a mob that is already dead, target the next mob automatically.
		
		for (let player of this.players_) {
			if (player.target_character_index == -1) {
				// Target first mob that is not dead.
				for (let index = 0; index < total_mobs; ++index) {
					let mob = this.mobs_[index];
					if (mob.hp > 0) {
						player.target_character_index = total_players + index;
						break;
					}
				}
			} else if (player.target_character_index >= total_players) {
				// If target is a dead mob, advance to next non dead mob. 
				let index = player.target_character_index - total_players;
				let mob = this.mobs_[index];
				while (mob.hp == 0) {
					index = (index + 1) % total_mobs;
					if (index == (player.target_character_index - total_players))
						break;
				}
				player.target_character_index = total_players + index;
			}
		}
	}

	UpdateTargetOfMobs_() {
		let total_players = this.players_.length;
		let total_mobs = this.mobs_.length;
		let total_characters = total_players + total_mobs;

		// For now, we just always have mobs target the warrior, but we should do
		// something more interesting based on threat calculations.

		let index;

		for (index = 0; index < total_players; ++index) {
			let player = this.players_[index];
			if (player.hp != 0 && player.character_class.name == "Warrior")
				break;
		}
		if (index == total_players) {  // Fallback to first player.
			for (index = 0; index < total_players; ++index) {
				let player = this.players_[index];
				if (player.hp != 0)
					break;
			}
		}

		for (let mob of this.mobs_) {
			if (mob.hp == 0) {
				mob.target_character_index = -1;
			} else {
				mob.target_character_index = index;
			}
		}
	}

	UpdateCoolDowns_(character) {
		let new_cool_downs = [];
		for (let cool_down of character.cool_downs) {
			cool_down.duration--;
			if (cool_down.duration > 0)
				new_cool_downs.push(cool_down); 
		}
		character.cool_downs = new_cool_downs;
	}

	UpdateCurrentAction_(character) {
		if (!character.current_action)
			return;

		character.current_action.duration--;

		let skill = character.current_action.skill;
		if (skill.cast_time == 0 || character.current_action.duration == 0) {
			for (let target_character of character.current_action.target_characters) {
				this.ApplySkillToCharacter_(target_character, skill);
			}
		}

		if (character.current_action.duration == 0)
			character.current_action = null;
	}

	ApplySkillToCharacter_(character, skill) {
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

	ApplyDebufToCharacter_(character, skill) {
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

	GetCharacter_(index) {
		let total_players = this.players_.length;
		let total_mobs = this.mobs_.length;
		let total_characters = total_players + total_mobs;

		if (index < 0)
			return null;
		if (index < total_players)
			return this.players_[index];
		if (index < total_characters)
			return this.mobs_[index - total_players];

		return null;
	}

	IsPlayer_(index) {
		return index >= 0 && index < this.players_.length;
	}

	IsMob_(index) {
		let total_players = this.players_.length;
		let total_mobs = this.mobs_.length;
		let total_characters = total_players + total_mobs;

		return index >= total_players && index < total_characters;
	}
}
