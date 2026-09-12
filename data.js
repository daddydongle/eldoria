const ESSENCES = [
  ['Fire','core',['Igniting Strike','Flame Wave','Cinder Shield','Thermal Aura','Blazing Surge']],
  ['Lightning','core',['Flash Step','Plasma Bolt','Overcharge','Static Field','Thunderclap']],
  ['Ice','core',['Frostbite Edge','Glacial Wall','Flash Freeze','Permafrost Aura','Rime Burst']],
  ['Earth','core',['Stone Skin','Tectonic Slam','Tremor Sensor','Boulder Toss','Granite Wall']],
  ['Wind','core',['Gale Slash','Zephyr Step','Wind Barrier','Air Vortex','Drafting Aura']],
  ['Light','core',['Luminous Beam','Solar Flare','Radiance Aura','Blinding Flash','Prism Shield']],
  ['Shadow','core',['Shadow Step','Umbral Veil','Dark Tendrils','Gloom Pulse','Shadow Bind']],
  ['Life','core',['Vitality Surge','Bloom Wave','Living Armor','Growth Aura','Regrow']],
  ['Death','core',['Decay Touch','Spirit Drain','Bone Spike','Necrotic Aura','Soul Reap']],
  ['Mind','core',['Psychic Blast','Thought Shield','Mind Link','Confuse','Telekinetic Push']],
  ['Time','core',['Haste Step','Temporal Anchor','Delay Field','Rewind','Stasis Lock']],
  ['Space','core',['Spatial Distortion','Blink Shift','Pocket Rift','Gravity Well','Void Gate']],
  ['Wolf','core',['Pack Hunter','Feral Pounce','Scent Tracker','Howl of Courage','Relentless Chase']],
  ['Bear','core',['Ursine Might','Maul','Thick Hide','Intimidating Roar','Hibernation Surge']],
  ['Spider','core',['Web Shot','Venomous Strike','Wall Crawler','Poison Thread','Silk Trap']],
  ['Snake','core',['Toxic Fang','Constrict','Viper Strike','Molt','Thermal Sight']],
  ['Phoenix','confluence',['Flame Rebirth','Solar Wings','Cinder Healing','Ashes to Ashes','Ignited Plumage']],
  ['Dragon','confluence',['Dragon Breath','Scale Armor','Draconic Presence','Tail Sweep','Wing Buffet']],
  ['Gate','confluence',['Dimensional Rift','Portal Link','Spatial Tear','Warp Step','Banishment']],
  ['Karma','confluence',['Retribution Strike','Equalizing Aura','Fate Tether','Merit Shield','Rebound Curse']]
].map(([name,type,abilities])=>({name,type,abilities}));

// The supplied sequence contains 19 distinct keys; [ completes the 20-slot bar.
const ABILITY_KEYS = ['`','1','2','3','4','5','6','7','8','9','0','-','=','e','r','t','y','u','i','['];
const progression = {
  rules:{coreEssencesRequired:3,confluenceEssencesRequired:1,essencesPerBuild:4,abilitiesPerEssence:5,totalAbilitySlots:20,baseAbilitiesOnCompletion:4,awakeningStoneUnlocks:16},
  absorbedCore:[], confluence:null, unlockedAbilities:[], awakeningStonesUsed:0,
  absorbCore(name){if(this.absorbedCore.length>=3)return false;const e=ESSENCES.find(x=>x.name===name&&x.type==='core');if(!e||this.absorbedCore.includes(name))return false;this.absorbedCore.push(name);return true},
  unlockConfluence(name){if(this.absorbedCore.length!==3)return false;const e=ESSENCES.find(x=>x.name===name&&x.type==='confluence');if(!e)return false;this.confluence=name;this.unlockedAbilities=[...this.absorbedCore,name].map(n=>ESSENCES.find(e=>e.name===n).abilities[0]);return true},
  useAwakeningStone(){if(!this.confluence||this.awakeningStonesUsed>=16)return null;const build=[...this.absorbedCore,this.confluence].map(n=>ESSENCES.find(e=>e.name===n));const locked=build.flatMap(e=>e.abilities.slice(1)).filter(a=>!this.unlockedAbilities.includes(a));const ability=locked[0];if(ability){this.unlockedAbilities.push(ability);this.awakeningStonesUsed++}return ability}
};
window.ELDORIA_DATA={ESSENCES,ABILITY_KEYS,progression};
