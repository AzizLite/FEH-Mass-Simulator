var debug = false;

data.weaponTypes = ["sword","lance","axe","redtome","bluetome","greentome","dragon","bow","dagger","staff"];
data.rangedWeapons = ["redtome","bluetome","greentome","bow","dagger","staff"];
data.meleeWeapons = ["sword","lance","axe","dragon"];
data.physicalWeapons = ["sword","lance","axe","bow","dagger"];
data.magicalWeapons = ["redtome","bluetome","greentome","dragon","staff"];
data.moveTypes = ["infantry","armored","flying","cavalry"];
data.colors = ["red","blue","green","gray"];

//Growth shifts of 3 are what make some banes/boons +/- 4
//growth table from https://feheroes.wiki/Stat_Growth
data.growths = [[6,8,9,11,13,14,16,18,19,21,23,24],
[7,8,10,12,14,15,17,19,21,23,25,26],
[7,9,11,13,15,17,19,21,23,25,27,29],
[8,10,12,14,16,18,20,22,24,26,28,31],
[8,10,13,15,17,19,22,24,26,28,30,33]];

//Holder for options that aren't hero-specific
var options = {};
options.autoCalculate = true;
options.startTurn = 0;
options.useGaleforce = true;
options.threatenRule = "Neither";
options.showOnlyMaxSkills = true;
options.hideUnaffectingSkills = true;

//Holder for challenger options and pre-calculated stats
var challenger = {};
challenger.index = -1;
var challenger.merge = 0;

//The following 6 arrays will be set from arrays generated in the heroes array so they don't have to be re-calculated
challenger.validWeaponSkills = [];
challenger.validSpecialSkills = [];
challenger.validASkills = [];
challenger.validBSkills = [];
challenger.validCSkills = [];
challenger.naturalSkills = []; //Skills the hero has without having to inherit

challenger.weapon = -1;
challenger.special = -1;
challenger.a = -1;
challenger.b = -1;
challenger.c = -1;
challenger.s = -1;

challenger.hp = 0;
challenger.atk = 0;
challenger.spd = 0;
challenger.def = 0;
challenger.res = 0;

challenger.damage = 0;
challenger.precharge = 0;

//Holder for enemy options and pre-calculated stats
var enemies = {};
enemies.fl = {}; //Full list
enemies.cl = {}; //Custom list

enemies.fl.include = {"melee":1,"ranged":1,"red":1,"blue":1,"green":1,"gray":1,"physical":1,"magical":1,"infantry":1,"cavalry":1,"flying":1,"armored":1,"staff":0,"nonstaff":1};


var enemies.fl.merge = 0;


var enemies.fl.damage = 0;


var enemies.fl.precharge = 0;

var challenger.rarity = 5;
var enemies.fl.rarity = 5;

var enemies.fl.weapon = -1;
var enemies.fl.special = -1;
var enemies.fl.a = -1;
var enemies.b = -1;
var enemies.c = -1;
var enemies.s = -1;

var challenger.boon = "None";
var challenger.bane = "None";
var enemies.fl.boon = "None";
var enemies.fl.bane = "None";

var enemies.fl.replaceWeapon = false;
var enemies.fl.replaceSpecial = false;
var enemies.fl.replaceA = false;
var enemies.fl.replaceB = false;
var enemies.fl.replaceC = false;

var heroPossibleSkills = [];
var heroBaseSkills = [];
var heroMaxSkills = [[],[],[],[],[]]; //2d array; 1st num rarity, 2nd num heroindex

var challenger.buffs = {"atk":0,"spd":0,"def":0,"res":0};
var enemies.fl.buffs = {"atk":0,"spd":0,"def":0,"res":0};
var challenger.debuffs = {"atk":0,"spd":0,"def":0,"res":0};
var enemies.fl.debuffs = {"atk":0,"spd":0,"def":0,"res":0};
var challenger.spur = {"atk":0,"spd":0,"def":0,"res":0};
var enemies.fl.spur = {"atk":0,"spd":0,"def":0,"res":0};



var viewFilter = 0;
var fightResults = []; //Needs to be global variable to get info for tooltip
var resultHTML = []; //Needs to be a global variable to flip sort order without recalculating
var previousFightResults = new Array(data.heroes.length); //For comparing between calculations; actually an array of html strings with index corresponding to heroes[] index
var nextPreviousFightResults = new Array(data.heroes.length); //Dumb
//.fill() doesn't work in older versions of IE
//previousFightResults.fill("");
for(var i = 0; i < previousFightResults.length;i++){
	previousFightResults[i] = "";
	nextPreviousFightResults[i] = "";
}

var showingTooltip = false;
var calcuwaiting = false;
var calcuwaitTime = 0;
var customEnemyList = false;
var enemyPrompts = {
	//Just for fun, special messages for some of my favorites ;)
	"default":"Enemies to fight:",
	"Effie":"Who to crush:",
	"Karel":"Time to feast:",
	"Nino":"Do my best:",
	"Sharena":"My turn!:"
}

var enemyAvgHp = 0;
var enemyAvgAtk = 0;
var enemyAvgSpd = 0;
var enemyAvgDef = 0;
var enemyAvgRes = 0;

var roundInitiators = ["Challenger initiates","Enemy initiates"];

var skillsThatArePrereq = [];
//Prereq exceptions are Sol, Luna, Astra, Assault
var skillPrereqExceptions = [125,162,168,170];

//Remember: heroes, skills, prereqs, and heroskills arrays come from PHP-created script

//Sort hero array by name
data.heroes.sort(function(a,b){
	//console.log(a.name + ", " + b.name + ": " + a.name>b.name);
	return (a.name>b.name)*2-1;
})

//Sort skills array by name
data.skills.sort(function(a,b){
	//console.log(a.name + ", " + b.name + ": " + a.name>b.name);
	return (a.name>b.name)*2-1;
})

var allWeaponSkills = getValidSkills("weapon");
var allSpecialSkills = getValidSkills("special");
var allASkills = getValidSkills("a");
var allBSkills = getValidSkills("b");
var allCSkills = getValidSkills("c");
var allSSkills = getValidSkills("s");

//Make list of all skill ids that are a strictly inferior prereq to exclude from dropdown boxes
for(var i = 0; i < data.prereqs.length;i++){
	if(skillsThatArePrereq.indexOf(data.prereqs[i].required_id)==-1 && skillPrereqExceptions.indexOf(data.prereqs[i].required_id)==-1){
		skillsThatArePrereq.push(data.prereqs[i].required_id);
	}
}

//Find hero skills
for(var i = 0; i < data.heroes.length;i++){
	heroPossibleSkills.push(getValidSkills(false,i));
	heroBaseSkills.push(findHeroSkills(i));
	for(var j = 0; j < 5; j++){
		heroMaxSkills[j].push(findMaxSkills(j,i));
	}
}

$(document).ready(function(){
	$("#enemy_select_text").html(enemyPrompts.default);
	
	//Populate hero select options
	heroHTML = "<option value=-1 class=\"hero_option\">Select Hero</option>";
	for(var i = 0; i < data.heroes.length; i++){
		heroHTML += "<option value=" + i + " class=\"hero_option\">" + data.heroes[i].name + "</option>";
	}
	$("#hero_name").html(heroHTML);
	$("#cl_enemy_name").html(heroHTML);

	setEnemySkillOptions();

	setEnemies();
	setEnemySkills();
	setEnemyStats();
	setUI();

	$("#hero_name").change(function(){
		challenger.index = $(this).val();

		if(challenger.index != -1){

			//find hero's starting skills
			challenger.naturalSkills = heroBaseSkills[challenger.index];

			challenger.validWeaponSkills = getValidSkills("weapon",challenger.index);
			challenger.validSpecialSkills = getValidSkills("special",challenger.index);
			challenger.validASkills = getValidSkills("a",challenger.index);
			challenger.validBSkills = getValidSkills("b",challenger.index);
			challenger.validCSkills = getValidSkills("c",challenger.index);
			validSSkills = getValidSkills("s",challenger.index);
			setSkillOptions();

			resetChallenger();

			$("#hero_weapon").val(challenger.weapon);
			$("#hero_special").val(challenger.special);
			$("#hero_a").val(challenger.a);
			$("#hero_b").val(challenger.b);
			$("#hero_c").val(challenger.c);
			//Need to set skill pictures; would just do this by triggering change function, but val() may not be done when we do that
			changeSkillPic("a",challenger.a);
			changeSkillPic("b",challenger.b);
			changeSkillPic("c",challenger.c);

			//Analytics
			dataLayer.push({"event":"changeHero","hero_name":data.heroes[challenger.index].name});

			//Change flavor text
			if(enemyPrompts[data.heroes[challenger.index].name]){
				$("#enemy_select_text").html(enemyPrompts[data.heroes[challenger.index].name]);
			}
			else{
				$("#enemy_select_text").html(enemyPrompts.default);
			}
		}

		setStats();
		setUI();

		calculate();
	});

	$("#challenger_merge").change(function(){
		var newVal = verifyNumberInput(this,0,10);
		challenger.merge = newVal;
		setStats();
		setUI();
		if(options.autoCalculate){
			calcuWait(300);
		}
	});
	$("#enemies_merge").change(function(){
		var newVal = verifyNumberInput(this,0,10);
		enemies.fl.merge = newVal;
		setEnemyStats();
		setUI();
		if(options.autoCalculate){
			calcuWait(300);
		}
	});

	$("#challenger_damage").change(function(){
		var newVal = verifyNumberInput(this,0,99);
		challenger.damage = newVal;
		setUI();
		if(options.autoCalculate){
			calcuWait(300);
		}
	});
	$("#enemies_damage").change(function(){
		var newVal = verifyNumberInput(this,0,99);
		enemies.fl.damage = newVal;
		if(options.autoCalculate){
			calcuWait(300);
		}
	});

	$("#challenger_precharge").change(function(){
		var newVal = verifyNumberInput(this,0,6);
		challenger.precharge = newVal;
		setUI();
		if(options.autoCalculate){
			calcuWait(300);
		}
	});
	$("#enemies_precharge").change(function(){
		var newVal = verifyNumberInput(this,0,6);
		setUI();
		enemies.fl.precharge = newVal;
		if(options.autoCalculate){
			calcuWait(300);
		}
	});

	$("#challenger_rarity").change(function(){
		var newVal = verifyNumberInput(this,1,5);
		challenger.rarity = newVal;
		setSkillOptions();
		challenger.weapon = heroMaxSkills[challenger.rarity-1][challenger.index].weapon;
		challenger.special = heroMaxSkills[challenger.rarity-1][challenger.index].special;
		challenger.a = heroMaxSkills[challenger.rarity-1][challenger.index].a;
		challenger.b = heroMaxSkills[challenger.rarity-1][challenger.index].b;
		challenger.c = heroMaxSkills[challenger.rarity-1][challenger.index].c;
		setStats();
		$("#hero_weapon").val(challenger.weapon);
		$("#hero_special").val(challenger.special);
		$("#hero_a").val(challenger.a);
		$("#hero_b").val(challenger.b);
		$("#hero_c").val(challenger.c);
		setUI();
		if(options.autoCalculate){
			calcuWait(300);
		}
	});
	$("#enemies_rarity").change(function(){
		var newVal = verifyNumberInput(this,1,5);
		enemies.fl.rarity = newVal;
		setEnemySkills();
		setEnemyStats();
		setUI();
		if(options.autoCalculate){
			calcuWait(300);
		}
	});

	$(".wideincludebutton, .thinincludebutton").click(function(){
		var includeRule = this.id.substring(8);
		if(enemies.fl.include[includeRule]){
			enemies.fl.include[includeRule] = 0;
			$(this).removeClass("included");
			$(this).addClass("notincluded");
		}
		else{
			enemies.fl.include[includeRule] = 1;
			$(this).removeClass("notincluded");
			$(this).addClass("included");
		}
		setEnemies();
		setEnemySkills();
		setEnemyStats();
		setUI();
		calculate();
	});

	$(".buff_input").change(function(){
		var newVal = verifyNumberInput(this,0,7);
		var buffStat = this.id.substring(this.id.length-8,this.id.length-5);
		if(this.id.substring(0,4)=="hero"){
			challenger.buffs[buffStat] = newVal;
		}
		else if(this.id.substring(0,7)=="enemies"){
			enemies.fl.buffs[buffStat] = newVal;
		}

		setUI();

		if(options.autoCalculate){
			calcuWait(300);
		}
	});

	$(".debuff_input").change(function(){
		var newVal = verifyNumberInput(this,-7,0);
		var debuffStat = this.id.substring(this.id.length-10,this.id.length-7);
		if(this.id.substring(0,4)=="hero"){
			challenger.debuffs[debuffStat] = newVal;
		}
		else if(this.id.substring(0,7)=="enemies"){
			enemies.fl.debuffs[debuffStat] = newVal;
		}

		setUI();

		if(options.autoCalculate){
			calcuWait(300);
		}
	});

	$(".spur_input").change(function(){
		var newVal = verifyNumberInput(this,0,12);
		var spurStat = this.id.substring(this.id.length-8,this.id.length-5);
		if(this.id.substring(0,4)=="hero"){
			challenger.spur[spurStat] = newVal;
		}
		else if(this.id.substring(0,7)=="enemies"){
			enemies.fl.spur[spurStat] = newVal;
		}

		setUI();

		if(options.autoCalculate){
			calcuWait(300);
		}
	});

	$("#challenger_boon").change(function(){
		challenger.boon = $(this).val();
		setStats();
		setUI();
		calculate();
	});
	$("#challenger_bane").change(function(){
		challenger.bane = $(this).val();
		setStats();
		setUI();
		calculate();
	});

	$("#enemies_boon").change(function(){
		enemies.fl.boon = $(this).val();
		setEnemyStats();
		setUI();
		calculate();
	});
	$("#enemies_bane").change(function(){
		enemies.fl.bane = $(this).val();
		setEnemyStats();
		setUI();
		calculate();
	});

	$("#hero_weapon").change(function(){
		challenger.weapon = parseInt($(this).val());
		if(challenger.weapon != -1){
			dataLayer.push({"event":"changeSkill","skill_name":data.skills[challenger.weapon].name});
		}
		setStats();
		setUI();
		calculate();
	});
	$("#hero_special").change(function(){
		challenger.special = parseInt($(this).val());
		if(challenger.special != -1){
			dataLayer.push({"event":"changeSkill","skill_name":data.skills[challenger.special].name});
		}
		setStats();
		setUI();
		calculate();
	});
	$("#hero_a").change(function(){
		challenger.a = parseInt($(this).val());
		if(challenger.a != -1){
			dataLayer.push({"event":"changeSkill","skill_name":data.skills[challenger.a].name});
		}
		changeSkillPic("a",challenger.a);
		setStats();
		setUI();
		calculate();
	});
	$("#hero_b").change(function(){
		challenger.b = parseInt($(this).val());
		if(challenger.b != -1){
			dataLayer.push({"event":"changeSkill","skill_name":data.skills[challenger.b].name});
		}
		changeSkillPic("b",challenger.b);
		setStats();
		setUI();
		calculate();
	});
	$("#hero_c").change(function(){
		challenger.c = parseInt($(this).val());
		if(challenger.c != -1){
			dataLayer.push({"event":"changeSkill","skill_name":data.skills[challenger.c].name});
		}
		changeSkillPic("c",challenger.c);
		setStats();
		setUI();
		calculate();
	});
	$("#hero_s").change(function(){
		challenger.s = parseInt($(this).val());
		if(challenger.s != -1){
			dataLayer.push({"event":"changeSkill","skill_name":"s_" + data.skills[challenger.s].name});
		}
		changeSkillPic("s",challenger.s);
		setStats();
		setUI();
		calculate();
	});

	$("#enemies_weapon").change(function(){
		enemies.fl.weapon = parseInt($(this).val());
		setEnemySkills();
		setEnemyStats();
		setUI();
		calculate();
	});
	$("#enemies_special").change(function(){
		enemies.fl.special = parseInt($(this).val());
		setEnemySkills();
		setEnemyStats();
		setUI();
		calculate();
	});
	$("#enemies_a").change(function(){
		enemies.fl.a = parseInt($(this).val());
		changeEnemiesSkillPic("a",enemies.fl.a);
		setEnemySkills();
		setEnemyStats();
		setUI();
		calculate();
	});
	$("#enemies_b").change(function(){
		enemies.b = parseInt($(this).val());
		changeEnemiesSkillPic("b",enemies.b);
		setEnemySkills();
		setEnemyStats();
		setUI();
		calculate();
	});
	$("#enemies_c").change(function(){
		enemies.c = parseInt($(this).val());
		changeEnemiesSkillPic("c",enemies.c);
		setEnemySkills();
		setEnemyStats();
		setUI();
		calculate();
	});
	$("#enemies_s").change(function(){
		enemies.s = parseInt($(this).val());
		changeEnemiesSkillPic("s",enemies.s);
		setEnemySkills();
		setEnemyStats();
		setUI();
		calculate();
	});

	$("#enemies_weapon_overwrite").change(function(){
		enemies.fl.replaceWeapon = parseInt($(this).val());
		setEnemySkills();
		setEnemyStats();
		setUI();
		calculate();
	});
	$("#enemies_special_overwrite").change(function(){
		enemies.fl.replaceSpecial = parseInt($(this).val());
		setEnemySkills();
		setEnemyStats();
		setUI();
		calculate();
	});
	$("#enemies_a_overwrite").change(function(){
		enemies.fl.replaceA = parseInt($(this).val());
		setEnemySkills();
		setEnemyStats();
		setUI();
		calculate();
	});
	$("#enemies_b_overwrite").change(function(){
		enemies.fl.replaceB = parseInt($(this).val());
		setEnemySkills();
		setEnemyStats();
		setUI();
		calculate();
	});
	$("#enemies_c_overwrite").change(function(){
		enemies.fl.replaceC = parseInt($(this).val());
		setEnemySkills();
		setEnemyStats();
		setUI();
		calculate();
	});

	$("#add_turn_challenger").click(function(){
		addTurn("Challenger initiates");
	})
	$("#add_turn_enemy").click(function(){
		addTurn("Enemy initiates");
	})

	$("#rules_prereqs").change(function(){
		if($(this).is(":checked")){
			options.showOnlyMaxSkills = true;
			if(challenger.index != -1){
				setSkillOptions();
				resetChallengerSkills();
			}	
		}
		else{
			options.showOnlyMaxSkills = false;
			if(challenger.index != -1){
				setSkillOptions();
				resetChallengerSkills();
			}
		}

		setEnemySkillOptions();
		setEnemySkills();
		setEnemyStats();
		setUI();

		calculate();
	});

	$("#rules_hideunaffecting").change(function(){
		if($(this).is(":checked")){
			options.hideUnaffectingSkills = true;
			if(challenger.index != -1){
				setSkillOptions();
				resetChallengerSkills();
			}	
		}
		else{
			options.hideUnaffectingSkills = false;
			if(challenger.index != -1){
				setSkillOptions();
				resetChallengerSkills();
			}
		}

		setEnemySkillOptions();
		setEnemySkills();
		setEnemyStats();
		setUI();

		calculate();
	});

	$("#rules_galeforce").change(function(){
		if($(this).is(":checked")){
			options.useGaleforce = true;
		}
		else{
			options.useGaleforce = false;
		}
		calculate();
	});

	$("#rules_threaten").change(function(){
		var newVal = $(this).val();
		options.threatenRule = newVal;
		calculate();
	});

	$("#rules_renewal").change(function(){
		var newVal = verifyNumberInput(this,0,3);
		options.startTurn = newVal;
		if(options.autoCalculate){
			calcuWait(300);
		}
	});

	$("#autocalculate").change(function(){
		if($(this).is(":checked")){
			options.autoCalculate = true;
			calculate();
		}
		else{
			options.autoCalculate = false;
		}
	});

	$("#view_results").change(function(){
		var newVal = verifyNumberInput(this,0,2);
		viewFilter = newVal;
		outputResults();
	});

	$("#sort_results").change(function(){
		outputResults();
	});

	$("#import_exit").click(function(){
		hideImportDialog();
	})

	$("#enemies_mode").change(function(){
		switchEnemySelect($(this).val());
	})

	$(document).mousemove(function(e){
		if(showingTooltip){
			var tooltipHeight =    $("#frame_tooltip").height();
			if(e.pageY + (tooltipHeight/2) + 10 > $("body").height()){
				$("#frame_tooltip").css({
					"left": e.pageX + 20 + "px",
					"top": e.pageY - tooltipHeight - 10 + "px"
				});
			}
			else{
				$("#frame_tooltip").css({
					"left": e.pageX + 20 + "px",
					"top": e.pageY - (tooltipHeight/2) + "px"
				});
			}	
		}	
	});

});

function changeSkillPic(slot,skillindex){
	if(skillindex < 0){
		$("#hero_" + slot + "_picture").attr("src","skills/noskill.png");
	}
	else{
		var skillname = data.skills[skillindex].name;
		skillname = skillname.replace(/\s/g,"_");
		$("#hero_" + slot + "_picture").attr("src","skills/" + skillname + ".png");
	}
}

function changeEnemiesSkillPic(slot,skillindex){
	if(skillindex < 0){
		$("#enemies_" + slot + "_picture").attr("src","skills/noskill.png");
	}
	else{
		var skillname = data.skills[skillindex].name;
		skillname = skillname.replace(/\s/g,"_");
		$("#enemies_" + slot + "_picture").attr("src","skills/" + skillname + ".png");
	}
}

function getValidSkills(slot,heroindex){
	//returns an array of indices on "skills" array for skills that heroindex can learn
	//If not given heroindex, returns all skills in slot except unique
	//if not given slot, gives all
	var validSkills = [];
	for(var i = 0; i < data.skills.length; i++){
		if(!slot || data.skills[i].slot == slot){
			if(heroindex != undefined){
				//console.log("Trying " + slot + ": " + data.skills[i].name);
				if(data.skills[i].inheritrule == "unique"){
					//can only use if hero starts with it
					for(var j = 0; j < challenger.naturalSkills.length; j++){
						if(challenger.naturalSkills[j][0] == data.skills[i].skill_id){
							validSkills.push(i);
						}
					}
				}
				else if(data.weaponTypes.indexOf(data.skills[i].inheritrule)!=-1){
					//inherit if weapon is right
					if(data.heroes[heroindex].weapontype==data.skills[i].inheritrule){
						validSkills.push(i);
					}
				}
				else if(data.moveTypes.indexOf(data.skills[i].inheritrule)!=-1){
					//inherit if movetype is right
					if(data.heroes[heroindex].movetype==data.skills[i].inheritrule){
						validSkills.push(i);
					}
				}
				else if(data.weaponTypes.indexOf(data.skills[i].inheritrule.replace("non",""))!=-1){
					//inherit if not a certain weapon
					if(data.heroes[heroindex].weapontype!=data.skills[i].inheritrule.replace("non","")){
						validSkills.push(i);
					}
				}
				else if(data.moveTypes.indexOf(data.skills[i].inheritrule.replace("non",""))!=-1){
					//inherit if not a certain movement type
					if(data.heroes[heroindex].movetype!=data.skills[i].inheritrule.replace("non","")){
						validSkills.push(i);
					}
				}
				else if(data.colors.indexOf(data.skills[i].inheritrule.replace("non",""))!=-1){
					//inherit if not a certain color
					if(data.heroes[heroindex].color!=data.skills[i].inheritrule.replace("non","")){
						validSkills.push(i);
					}
				}
				else if(data.skills[i].inheritrule=="ranged"){
					//inherit if weapon type in ranged group
					if(data.rangedWeapons.indexOf(data.heroes[heroindex].weapontype) != -1){
						validSkills.push(i);
					}
				}
				else if(data.skills[i].inheritrule=="melee"){
					//inherit if weapon type in melee group
					if(data.meleeWeapons.indexOf(data.heroes[heroindex].weapontype) != -1){
						validSkills.push(i);
					}
				}
				else if(data.skills[i].inheritrule==""){
					//everyone can inherit!
					validSkills.push(i);
				}
				else{
					//shouldn't get here
					console.log("Issue finding logic for inheritrule " + data.skills[i].inheritrule);
				}
			}
			else{
				//It's the right slot, not given heroindex, so it's valid unless unique
				if(data.skills[i].inheritrule != "unique"){
					validSkills.push(i);
				}
			}
		}
	}
	return validSkills;	
}

function findHeroSkills(heroIndex){
	//returns an array of arrays of skill-rarity pairs
	var skillset = [];
	for(var i = 0; i < data.heroSkills.length;i++){
		if(data.heroSkills[i].hero_id==data.heroes[heroIndex].hero_id){
			var skillPair = [data.heroSkills[i].skill_id,data.heroSkills[i].rarity];
			skillset.push(skillPair);
		}
	}
	return skillset;
}

function findMaxSkills(rarity,heroid){
	//Finds max skills based on rarity
	//Gets one with highest sp cost
	var maxskillset = {"weapon":-1,"special":-1,"a":-1,"b":-1,"c":-1};
	for(var i = 0; i < heroBaseSkills[heroid].length;i++){
		var skillIndex = getSkillIndexFromId(heroBaseSkills[heroid][i][0]);
		var skill = data.skills[skillIndex];
		if((skill.slot != "s" && skill.slot != "assist") && heroBaseSkills[heroid][i][1] <= rarity + 1){
			if(maxskillset[skill.slot]==-1){
				maxskillset[skill.slot] = skillIndex;
			}
			else{
				if(data.skills[maxskillset[skill.slot]].sp < skill.sp){
					maxskillset[skill.slot] = skillIndex;
				}
			}
		}
	}
	return maxskillset;
}

function setSkillOptions(){
	//set html for character skill select based on valid skills

	//Set weapon skill options
	weaponHTML = "<option value=-1>No weapon</option>";
	for(var i = 0; i < challenger.validWeaponSkills.length; i++){
		if(((!options.showOnlyMaxSkills || skillsThatArePrereq.indexOf(data.skills[challenger.validWeaponSkills[i]].skill_id)==-1) && (!options.hideUnaffectingSkills || data.skills[challenger.validWeaponSkills[i]].affectsduel)) || challenger.validWeaponSkills[i] == heroMaxSkills[challenger.rarity-1][challenger.index].weapon){
			weaponHTML += "<option value=" + challenger.validWeaponSkills[i] + ">" + data.skills[challenger.validWeaponSkills[i]].name + "</option>";
		}
	}
	$("#hero_weapon").html(weaponHTML);

	//Set special skill options
	specialHTML = "<option value=-1>No special</option>";
	for(var i = 0; i < challenger.validSpecialSkills.length; i++){
		if(((!options.showOnlyMaxSkills || skillsThatArePrereq.indexOf(data.skills[challenger.validSpecialSkills[i]].skill_id)==-1) && (!options.hideUnaffectingSkills || data.skills[challenger.validSpecialSkills[i]].affectsduel)) || challenger.validSpecialSkills[i] == heroMaxSkills[challenger.rarity-1][challenger.index].special){
			specialHTML += "<option value=" + challenger.validSpecialSkills[i] + ">" + data.skills[challenger.validSpecialSkills[i]].name + "</option>";
		}
	}
	$("#hero_special").html(specialHTML);

	//Set a skill options
	aHTML = "<option value=-1>No A passive</option>";
	for(var i = 0; i < challenger.validASkills.length; i++){
		if(((!options.showOnlyMaxSkills || skillsThatArePrereq.indexOf(data.skills[challenger.validASkills[i]].skill_id)==-1) && (!options.hideUnaffectingSkills || data.skills[challenger.validASkills[i]].affectsduel)) || challenger.validASkills[i] == heroMaxSkills[challenger.rarity-1][challenger.index].a){
			aHTML += "<option value=" + challenger.validASkills[i] + ">" + data.skills[challenger.validASkills[i]].name + "</option>";
		}
	}
	$("#hero_a").html(aHTML);

	//Set weapon skill options
	bHTML = "<option value=-1>No B passive</option>";
	for(var i = 0; i < challenger.validBSkills.length; i++){
		if(((!options.showOnlyMaxSkills || skillsThatArePrereq.indexOf(data.skills[challenger.validBSkills[i]].skill_id)==-1) && (!options.hideUnaffectingSkills || data.skills[challenger.validBSkills[i]].affectsduel)) || challenger.validBSkills[i] == heroMaxSkills[challenger.rarity-1][challenger.index].b){
			bHTML += "<option value=" + challenger.validBSkills[i] + ">" + data.skills[challenger.validBSkills[i]].name + "</option>";
		}
	}
	$("#hero_b").html(bHTML);

	//Set c skill options
	cHTML = "<option value=-1>No C passive</option>";
	for(var i = 0; i < challenger.validCSkills.length; i++){
		if(((!options.showOnlyMaxSkills || skillsThatArePrereq.indexOf(data.skills[challenger.validCSkills[i]].skill_id)==-1) && (!options.hideUnaffectingSkills || data.skills[challenger.validCSkills[i]].affectsduel)) || challenger.validCSkills[i] == heroMaxSkills[challenger.rarity-1][challenger.index].c){
			cHTML += "<option value=" + challenger.validCSkills[i] + ">" + data.skills[challenger.validCSkills[i]].name + "</option>";
		}
	}
	$("#hero_c").html(cHTML);

	//Set s skill options
	sHTML = "<option value=-1>No S passive</option>";
	for(var i = 0; i < validSSkills.length; i++){
		if((!options.showOnlyMaxSkills || skillsThatArePrereq.indexOf(data.skills[validSSkills[i]].skill_id)==-1) && (!options.hideUnaffectingSkills || data.skills[validSSkills[i]].affectsduel)){
			sHTML += "<option value=" + validSSkills[i] + ">" + data.skills[validSSkills[i]].name + "</option>";
		}
	}
	$("#hero_s").html(sHTML);

}

function setEnemySkillOptions(){
	//set html for enemies skill select

	//Set weapon skill options
	weaponHTML = "<option value=-1>No weapon</option>";
	for(var i = 0; i < allWeaponSkills.length; i++){
		if((!options.showOnlyMaxSkills || skillsThatArePrereq.indexOf(data.skills[allWeaponSkills[i]].skill_id)==-1) && (!options.hideUnaffectingSkills || data.skills[allWeaponSkills[i]].affectsduel)){
			weaponHTML += "<option value=" + allWeaponSkills[i] + ">" + data.skills[allWeaponSkills[i]].name + "</option>";
		}
	}
	$("#enemies_weapon").html(weaponHTML);

	//Set special skill options
	specialHTML = "<option value=-1>No special</option>";
	for(var i = 0; i < allSpecialSkills.length; i++){
		if((!options.showOnlyMaxSkills || skillsThatArePrereq.indexOf(data.skills[allSpecialSkills[i]].skill_id)==-1) && (!options.hideUnaffectingSkills || data.skills[allSpecialSkills[i]].affectsduel)){
			specialHTML += "<option value=" + allSpecialSkills[i] + ">" + data.skills[allSpecialSkills[i]].name + "</option>";
		}
	}
	$("#enemies_special").html(specialHTML);

	//Set a skill options
	aHTML = "<option value=-1>No A passive</option>";
	for(var i = 0; i < allASkills.length; i++){
		if((!options.showOnlyMaxSkills || skillsThatArePrereq.indexOf(data.skills[allASkills[i]].skill_id)==-1) && (!options.hideUnaffectingSkills || data.skills[allASkills[i]].affectsduel)){
			aHTML += "<option value=" + allASkills[i] + ">" + data.skills[allASkills[i]].name + "</option>";
		}
	}
	$("#enemies_a").html(aHTML);

	//Set weapon skill options
	bHTML = "<option value=-1>No B passive</option>";
	for(var i = 0; i < allBSkills.length; i++){
		if((!options.showOnlyMaxSkills || skillsThatArePrereq.indexOf(data.skills[allBSkills[i]].skill_id)==-1) && (!options.hideUnaffectingSkills || data.skills[allBSkills[i]].affectsduel)){
			bHTML += "<option value=" + allBSkills[i] + ">" + data.skills[allBSkills[i]].name + "</option>";
		}
	}
	$("#enemies_b").html(bHTML);

	//Set c skill options
	cHTML = "<option value=-1>No C passive</option>";
	for(var i = 0; i < allCSkills.length; i++){
		if((!options.showOnlyMaxSkills || skillsThatArePrereq.indexOf(data.skills[allCSkills[i]].skill_id)==-1) && (!options.hideUnaffectingSkills || data.skills[allCSkills[i]].affectsduel)){
			cHTML += "<option value=" + allCSkills[i] + ">" + data.skills[allCSkills[i]].name + "</option>";
		}
	}
	$("#enemies_c").html(cHTML);

	//Set s skill options
	sHTML = "<option value=-1>No S passive</option>";
	for(var i = 0; i < allSSkills.length; i++){
		if((!options.showOnlyMaxSkills || skillsThatArePrereq.indexOf(data.skills[allSSkills[i]].skill_id)==-1) && (!options.hideUnaffectingSkills || data.skills[allSSkills[i]].affectsduel)){
			sHTML += "<option value=" + allSSkills[i] + ">" + data.skills[allSSkills[i]].name + "</option>";
		}
	}
	$("#enemies_s").html(sHTML);
}

function setStats(){
	if(challenger.index != -1){
		var growthValMod = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
		if(challenger.boon!="none"){
			growthValMod[challenger.boon]+=1;
		}
		if(challenger.bane!="none"){
			growthValMod[challenger.bane]-=1;
		}

		var base = {};
		base.hp = data.heroes[challenger.index].basehp + growthValMod.hp;
		base.atk = data.heroes[challenger.index].baseatk + growthValMod.atk;
		base.spd = data.heroes[challenger.index].basespd + growthValMod.spd;
		base.def = data.heroes[challenger.index].basedef + growthValMod.def;
		base.res = data.heroes[challenger.index].baseres + growthValMod.res;

		challenger.hp = base.hp + data.growths[challenger.rarity-1][data.heroes[challenger.index].hpgrowth + growthValMod.hp];
		challenger.atk = base.atk + data.growths[challenger.rarity-1][data.heroes[challenger.index].atkgrowth + growthValMod.atk];
		challenger.spd = base.spd + data.growths[challenger.rarity-1][data.heroes[challenger.index].spdgrowth + growthValMod.spd];
		challenger.def = base.def + data.growths[challenger.rarity-1][data.heroes[challenger.index].defgrowth + growthValMod.def];
		challenger.res = base.res + data.growths[challenger.rarity-1][data.heroes[challenger.index].resgrowth + growthValMod.res];

		//Add merge bonuses
		var mergeBoost = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};

		//Order that merges happen is highest base stats, tiebreakers go hp->atk->spd->def->res
		var mergeOrder = ["hp","atk","spd","def","res"];
		var boostPriority = {"hp":4,"atk":3,"spd":2,"def":1,"res":0};
		mergeOrder.sort(function(a,b){
			if(base[a]>base[b]){
				return -1;
			}
			else if(base[a]<base[b]){
				return 1;
			}
			else{
				if(boostPriority[a]>boostPriority[b]){
					return -1;
				}
				else{
					return 1;
				}
			}
		});

		var mergeBoostCount = challenger.merge*2;
		for(var i = 0; i < mergeBoostCount; i++){
			mergeBoost[mergeOrder[i%5]]++;
		}

		if(challenger.rarity<5){
			//Modify base stats based on rarity
			//Order that base stats increase by rarity is similar to merge bonuses, except HP always happens at 3* and 5*
			//Rarity base boosts don't taken into account boons/banes, so modify bases again and sort again
			base.atk = base.atk - growthValMod.atk;
			base.spd = base.spd - growthValMod.spd;
			base.def = base.def - growthValMod.def;
			base.res = base.res - growthValMod.res;

			var rarityBaseOrder = ["atk","spd","def","res"];
			rarityBaseOrder.sort(function(a,b){
				if(base[a]>base[b]){
					return -1;
				}
				else if(base[a]<base[b]){
					return 1;
				}
				else{
					if(boostPriority[a]>boostPriority[b]){
						return -1;
					}
					else{
						return 1;
					}
				}
			});

			rarityBaseOrder.push("hp");
			var rarityBoostCount = Math.floor((challenger.rarity-1) * 2.5);

			//Just going to dump these stat boosts in mergeBoost
			for(var i = 0; i < rarityBoostCount; i++){
				mergeBoost[rarityBaseOrder[i%5]]++;
			}

			//Subtract 2 from every stat since bases are pulled in at 5*
			mergeBoost.hp -= 2;
			mergeBoost.atk -= 2;
			mergeBoost.spd -= 2;
			mergeBoost.def -= 2;
			mergeBoost.res -= 2;
		}

		challenger.hp += mergeBoost.hp;
		challenger.atk += mergeBoost.atk;
		challenger.spd += mergeBoost.spd;
		challenger.def += mergeBoost.def;
		challenger.res += mergeBoost.res;

		//Add stats based on skills
		//Weapons only affect spd and atk right now
		if(challenger.weapon != -1){
			challenger.atk += data.skills[challenger.weapon].atk;
			challenger.spd += data.skills[challenger.weapon].spd;
		}

		//A-passive and S only ones that affects stats
		if(challenger.a != -1){
			challenger.hp += data.skills[challenger.a].hp;
			challenger.atk += data.skills[challenger.a].atk;
			challenger.spd += data.skills[challenger.a].spd;
			challenger.def += data.skills[challenger.a].def;
			challenger.res += data.skills[challenger.a].res;
		}

		if(challenger.s != -1){
			challenger.hp += data.skills[challenger.s].hp;
			challenger.atk += data.skills[challenger.s].atk;
			challenger.spd += data.skills[challenger.s].spd;
			challenger.def += data.skills[challenger.s].def;
			challenger.res += data.skills[challenger.s].res;
		}
	}
}

function setEnemies(){
	//sets enemies based on includerules
	//also updates enemy count display
	//Must be run before setEnemyStats() or setEnemySkills();
	enemies.fl.list = [];
	for(var i = 0; i < data.heroes.length;i++){
		var confirmed = true;
		//check color
		if(!enemies.fl.include[data.heroes[i].color]){
			confirmed = false;
		}
		//check move type
		else if(!enemies.fl.include[data.heroes[i].movetype]){		
			confirmed = false;
		}
		//check weapon range
		else if(!enemies.fl.include["melee"] && data.meleeWeapons.indexOf(data.heroes[i].weapontype)>=0){
			confirmed = false;
		}
		else if(!enemies.fl.include["ranged"] && data.rangedWeapons.indexOf(data.heroes[i].weapontype)>=0){
			confirmed = false;
		}
		//check weapon attack type
		else if(!enemies.fl.include["physical"] && data.physicalWeapons.indexOf(data.heroes[i].weapontype)>=0){
			confirmed = false;
		}
		else if(!enemies.fl.include["magical"] && data.magicalWeapons.indexOf(data.heroes[i].weapontype)>=0){
			confirmed = false;
		}
		else if(!enemies.fl.include["staff"] && data.heroes[i].weapontype == "staff"){
			confirmed = false;
		}
		else if(!enemies.fl.include["nonstaff"] && data.heroes[i].weapontype != "staff"){
			confirmed = false;
		}
		if(confirmed){
			enemies.fl.list.push({"index":i,"name":data.heroes[i].name,"weapontype":data.heroes[i].weapontype,"color":data.heroes[i].color,"movetype":data.heroes[i].movetype,"hp":0,"atk":0,"spd":0,"def":0,"res":0,"weapon":-1,"special":-1,"a":-1,"b":-1,"c":-1});
		}
	}
	$("#enemies_count").html(enemies.fl.list.length);
}

function setEnemySkills(){
	//Sets enemy skills for easy reference during calculation
	//setEnemies() should be called before this
	for(var i = 0; i < enemies.fl.list.length;i++){
		//Set default skills
		enemies.fl.list[i].weapon = heroMaxSkills[enemies.fl.rarity-1][enemies.fl.list[i].index].weapon;	
		enemies.fl.list[i].special = heroMaxSkills[enemies.fl.rarity-1][enemies.fl.list[i].index].special;
		enemies.fl.list[i].a = heroMaxSkills[enemies.fl.rarity-1][enemies.fl.list[i].index].a;
		enemies.fl.list[i].b = heroMaxSkills[enemies.fl.rarity-1][enemies.fl.list[i].index].b;
		enemies.fl.list[i].c = heroMaxSkills[enemies.fl.rarity-1][enemies.fl.list[i].index].c;
		enemies.fl.list[i].s = -1;

		//Find if skill needs replacement based on inputs
		if(enemies.fl.weapon != -1 && (enemies.fl.replaceWeapon || enemies.fl.list[i].weapon == -1)){
			if(heroPossibleSkills[enemies.fl.list[i].index].includes(enemies.fl.weapon)){
				enemies.fl.list[i].weapon = enemies.fl.weapon;
			}
		}
		if(enemies.fl.special != -1 && (enemies.fl.replaceSpecial || enemies.fl.list[i].special == -1)){
			if(heroPossibleSkills[enemies.fl.list[i].index].includes(enemies.fl.special)){
				enemies.fl.list[i].special = enemies.fl.special;
			}
		}
		if(enemies.fl.a != -1 && (enemies.fl.replaceA || enemies.fl.list[i].a == -1)){
			if(heroPossibleSkills[enemies.fl.list[i].index].includes(enemies.fl.a)){
				enemies.fl.list[i].a = enemies.fl.a;
			}
		}
		if(enemies.b != -1 && (enemies.fl.replaceB || enemies.fl.list[i].b == -1)){
			if(heroPossibleSkills[enemies.fl.list[i].index].includes(enemies.b)){
				enemies.fl.list[i].b = enemies.b;
			}
		}
		if(enemies.c != -1 && (enemies.fl.replaceC || enemies.fl.list[i].c == -1)){
			if(heroPossibleSkills[enemies.fl.list[i].index].includes(enemies.c)){
				enemies.fl.list[i].c = enemies.c;
			}
		}
		if(enemies.s != -1){
			if(heroPossibleSkills[enemies.fl.list[i].index].includes(enemies.s)){
				enemies.fl.list[i].s = enemies.s;
			}
		}
	}
}

function setEnemyStats(){
	//Get average enemy stats and set specific enemy stats
	//setEnemySkills() should be called before this
	enemyAvgHp = 0;
	enemyAvgAtk = 0;
	enemyAvgSpd = 0;
	enemyAvgDef = 0;
	enemyAvgRes = 0;

	for(var i = 0; i < enemies.fl.list.length;i++){
		var growthValMod = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
		if(enemies.fl.boon!="none"){
			growthValMod[enemies.fl.boon]+=1;
		}
		if(enemies.fl.bane!="none"){
			growthValMod[enemies.fl.bane]-=1;
		}

		var base = {};
		base.hp = data.heroes[enemies.fl.list[i].index].basehp + growthValMod.hp;
		base.atk = data.heroes[enemies.fl.list[i].index].baseatk + growthValMod.atk;
		base.spd = data.heroes[enemies.fl.list[i].index].basespd + growthValMod.spd;
		base.def = data.heroes[enemies.fl.list[i].index].basedef + growthValMod.def;
		base.res = data.heroes[enemies.fl.list[i].index].baseres + growthValMod.res;

		enemies.fl.list[i].hp = base.hp + data.growths[enemies.fl.rarity-1][data.heroes[enemies.fl.list[i].index].hpgrowth + growthValMod.hp];
		enemies.fl.list[i].atk = base.atk + data.growths[enemies.fl.rarity-1][data.heroes[enemies.fl.list[i].index].atkgrowth + growthValMod.atk];
		enemies.fl.list[i].spd = base.spd + data.growths[enemies.fl.rarity-1][data.heroes[enemies.fl.list[i].index].spdgrowth + growthValMod.spd];
		enemies.fl.list[i].def = base.def + data.growths[enemies.fl.rarity-1][data.heroes[enemies.fl.list[i].index].defgrowth + growthValMod.def];
		enemies.fl.list[i].res = base.res + data.growths[enemies.fl.rarity-1][data.heroes[enemies.fl.list[i].index].resgrowth + growthValMod.res];

		//Add merge bonuses
		var mergeBoost = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};

		//Order that merges happen is highest base stats, tiebreakers go hp->atk->spd->def->res
		var mergeOrder = ["hp","atk","spd","def","res"];
		var boostPriority = {"hp":4,"atk":3,"spd":2,"def":1,"res":0};
		mergeOrder.sort(function(a,b){
			if(base[a]>base[b]){
				return -1;
			}
			else if(base[a]<base[b]){
				return 1;
			}
			else{
				if(boostPriority[a]>boostPriority[b]){
					return -1;
				}
				else{
					return 1;
				}
			}
		});

		var mergeBoostCount = enemies.fl.merge*2;
		for(var j = 0; j < mergeBoostCount; j++){
			mergeBoost[mergeOrder[j%5]]++;
		}

		if(enemies.fl.rarity<5){
			//Modify base stats based on rarity
			//Order that base stats increase by rarity is similar to merge bonuses, except HP always happens at 3* and 5*
			//Rarity base boosts don't taken into account boons/banes, so modify bases again and sort again
			base.atk = base.atk - growthValMod.atk;
			base.spd = base.spd - growthValMod.spd;
			base.def = base.def - growthValMod.def;
			base.res = base.res - growthValMod.res;

			var rarityBaseOrder = ["atk","spd","def","res"];
			rarityBaseOrder.sort(function(a,b){
				if(base[a]>base[b]){
					return -1;
				}
				else if(base[a]<base[b]){
					return 1;
				}
				else{
					if(boostPriority[a]>boostPriority[b]){
						return -1;
					}
					else{
						return 1;
					}
				}
			});

			rarityBaseOrder.push("hp");
			var rarityBoostCount = Math.floor((enemies.fl.rarity-1) * 2.5);

			//Just going to dump these stat boosts in mergeBoost
			for(var j = 0; j < rarityBoostCount; j++){
				mergeBoost[rarityBaseOrder[i%5]]++;
			}

			//Subtract 2 from every stat since bases are pulled in at 5*
			mergeBoost.hp -= 2;
			mergeBoost.atk -= 2;
			mergeBoost.spd -= 2;
			mergeBoost.def -= 2;
			mergeBoost.res -= 2;
		}

		enemies.fl.list[i].hp += mergeBoost.hp;
		enemies.fl.list[i].atk += mergeBoost.atk;
		enemies.fl.list[i].spd += mergeBoost.spd;
		enemies.fl.list[i].def += mergeBoost.def;
		enemies.fl.list[i].res += mergeBoost.res;

		//Add stats based on skills
		//Weapons only affect spd and atk right now
		if(enemies.fl.list[i].weapon != -1){
			enemies.fl.list[i].atk += data.skills[enemies.fl.list[i].weapon].atk;
			enemies.fl.list[i].spd += data.skills[enemies.fl.list[i].weapon].spd;
		}

		//A-passive and S only one that affects stats
		if(enemies.fl.list[i].a != -1){
			enemies.fl.list[i].hp += data.skills[enemies.fl.list[i].a].hp;
			enemies.fl.list[i].atk += data.skills[enemies.fl.list[i].a].atk;
			enemies.fl.list[i].spd += data.skills[enemies.fl.list[i].a].spd;
			enemies.fl.list[i].def += data.skills[enemies.fl.list[i].a].def;
			enemies.fl.list[i].res += data.skills[enemies.fl.list[i].a].res;
		}

		if(enemies.fl.list[i].s != -1){
			enemies.fl.list[i].hp += data.skills[enemies.fl.list[i].s].hp;
			enemies.fl.list[i].atk += data.skills[enemies.fl.list[i].s].atk;
			enemies.fl.list[i].spd += data.skills[enemies.fl.list[i].s].spd;
			enemies.fl.list[i].def += data.skills[enemies.fl.list[i].s].def;
			enemies.fl.list[i].res += data.skills[enemies.fl.list[i].s].res;
		}

		enemyAvgHp += enemies.fl.list[i].hp;
		enemyAvgAtk += enemies.fl.list[i].atk;
		enemyAvgSpd += enemies.fl.list[i].spd;
		enemyAvgDef += enemies.fl.list[i].def;
		enemyAvgRes += enemies.fl.list[i].res;
	}
	enemyAvgHp = Math.round(enemyAvgHp/enemies.fl.list.length);
	enemyAvgAtk = Math.round(enemyAvgAtk/enemies.fl.list.length);
	enemyAvgSpd = Math.round(enemyAvgSpd/enemies.fl.list.length);
	enemyAvgDef = Math.round(enemyAvgDef/enemies.fl.list.length);
	enemyAvgRes = Math.round(enemyAvgRes/enemies.fl.list.length);
}

function setUI(){
	if(challenger.index != -1){
		$("#challenger_picture").attr("src","heroes/" + data.heroes[challenger.index].name + ".png");
		$("#hero_hp").html(challenger.hp);
		$("#challenger_currenthp").html(challenger.hp - challenger.damage);
		$("#hero_atk").html(challenger.atk);
		$("#hero_spd").html(challenger.spd);
		$("#hero_def").html(challenger.def);
		$("#hero_res").html(challenger.res);
		if(data.heroes[challenger.index].weapontype != "dragon"){
			$("#challenger_weapon_icon").attr("src","weapons/" + data.heroes[challenger.index].weapontype + ".png");
		}
		else{
			$("#challenger_weapon_icon").attr("src","weapons/" + data.heroes[challenger.index].color + "dragon.png");
		}

		if(challenger.special != -1){
			var specialCharge = data.skills[challenger.special].charge;
			if(challenger.weapon != -1){
				var weaponName = data.skills[challenger.weapon].name;
				if(weaponName.includes("Killer") || weaponName.includes("Killing") || weaponName.includes("Mystletainn") || weaponName.includes("Hauteclere")){
					specialCharge -= 1;
				}
				else if(weaponName.includes("Raudrblade") || weaponName.includes("Lightning Breath") || weaponName.includes("Blarblade") || weaponName.includes("Gronnblade")){
					specialCharge += 1;
				}
				specialCharge -= challenger.precharge;
				specialCharge = Math.max(0,specialCharge);
			}
			$("#challenger_specialcharge").html(specialCharge);
		}
		else{
			$("#challenger_specialcharge").html("-");
		}
	}

	if(enemies.fl.list.length > 0){
		$("#enemies_hp").html(enemyAvgHp);
		$("#enemies_atk").html(enemyAvgAtk);
		$("#enemies_spd").html(enemyAvgSpd);
		$("#enemies_def").html(enemyAvgDef);
		$("#enemies_res").html(enemyAvgRes);
	}
	else{
		$("#enemies_hp").html("-");
		$("#enemies_atk").html("-");
		$("#enemies_spd").html("-");
		$("#enemies_def").html("-");
		$("#enemies_res").html("-");
	}
	
}

function getSkillIndexFromId(skillid){
	var index = -1;
	for(var i = 0; i < data.skills.length; i++){
		if(data.skills[i].skill_id == skillid){
			index = i;
			break;
		}
	}
	//console.log("Looked for index of skill id " + skillid + "; found at " + index);
	return index;
}

function fight(enemyIndex){
	//returns object with: challenger.hp, enemyHp, rounds, and enemy object for stripping skills

	var fightText = "";

	var challenger = new activeHero(challenger.index,true);
	var enemy  = new activeHero(enemyIndex);

	var rounds = 0;

	for(var round = 1; round <= roundInitiators.length;round++){
		rounds = round;
		var turn = options.startTurn + round - 1;
		fightText += "<div class=\"fight_round\"><span class=\"bold\">Round " + round + ": ";
		if(roundInitiators[round-1]=="Challenger initiates"){
			fightText += challenger.name + " initiates</span><br>";
			fightText += challenger.attack(enemy,turn);
		}
		else{
			fightText += enemy.name + " initiates</span><br>";
			fightText +=  enemy.attack(challenger,turn);
		}
		if(enemy.hp <= 0 || challenger.hp <= 0){
			break;
		}
		fightText += "</div>";
	}

	//Have to make copy of enemy object
	return {"challenger.hp":Math.max(challenger.hp,0),"enemyHp":Math.max(enemy.hp,0),"rounds":rounds,"fightText":fightText,"enemy":$.extend({},enemy)};
}

function calcuWait(ms){//har har har
	//Waits to calculate on inputs like numbers that may be clicked a lot in a short time
	calcuwaitTime = ms;
	if(!calcuwaiting){
		calcuwaiting = true;
		calcuwaitTimer();
	}
}

function calcuwaitTimer(){
	if(calcuwaitTime <= 0){
		calcuwaiting = false;
		calculate();
	}
	else{
		calcuwaitTime -= 50;
		setTimeout(calcuwaitTimer,50);
	}
}

function calculate(manual){
	//manual = true if button was clicked
	//calculates results and also adds them to page
	if(options.autoCalculate || manual){
		if(challenger.index!=-1 && roundInitiators.length > 0 && enemies.fl.list.length > 0){
			var wins = 0;
			var losses = 0;
			var inconclusive = 0;

			for(var i = 0; i < nextPreviousFightResults.length; i++){
				previousFightResults[i] = nextPreviousFightResults[i];
			}

			fightResults = [];
			resultHTML = [];

			for(var i = 0;i<enemies.fl.list.length;i++){
				fightResults.push(fight(i));
			}

			fightResults.sort(function(a,b){
				//sort fights from best wins to worst losses
				//first by win, then by rounds, then by hp
				var comparison = 0;
				if(a.enemyHp==0){
					if(b.enemyHp!=0){
						comparison = -1;
					}
					else{
						if(a.rounds<b.rounds){
							comparison = -1;
						}
						else if(a.rounds>b.rounds){
							comparison = 1;
						}
						else{
							if(a.challenger.hp>b.challenger.hp){
								comparison = -1;
							}
							else if(a.challenger.hp<b.challenger.hp){
								comparison = 1;
							}
							else{
								comparison = 0;
							}
						}
					}
				}
				else if(a.challenger.hp==0){
					if(b.challenger.hp!=0){
						comparison = 1;
					}
					else{
						if(a.rounds<b.rounds){
							comparison = 1;
						}
						else if(a.rounds>b.rounds){
							comparison = -1;
						}
						else{
							//sort by enemy hp taken instead of challenger hp
							if(a.enemy.maxHp-a.enemyHp>b.enemy.maxHp-b.enemyHp){
								comparison = -1;
							}
							else if(a.enemy.maxHp-a.enemyHp<b.enemy.maxHp-b.enemyHp){
								comparison = 1;
							}
							else{
								comparison = 0;
							}
						}
					}
				}
				else{
					if(b.enemyHp==0){
						comparison = 1;
					}
					else if(b.challenger.hp==0){
						comparison = -1;
					}
					else{
						//in a stalemate, rounds will always be max, so can't sort by rounds
						if(a.challenger.hp>b.challenger.hp){
							comparison = -1;
						}
						else if(a.challenger.hp<b.challenger.hp){
							comparison = 1;
						}
						else{
							if(a.enemyHp<b.enemyHp){
								comparison = -1;
							}
							else if(a.enemyHp>b.enemyHp){
								comparison = 1;
							}
							else{
								comparison = 0;
							}
						}
					}
				}

				return comparison;
			});

			for(var i = 0; i < fightResults.length;i++){
				var resultText = "";

				if(fightResults[i].challenger.hp==0){
					losses++;
					resultText = "<span class=\"red\">loss</span>, " + fightResults[i].rounds;
					if(fightResults[i].rounds==1){
						resultText += " round";
					}
					else{
						resultText += " rounds";
					}
				}
				else if(fightResults[i].enemyHp==0){
					wins++;
					resultText = "<span class=\"blue\">win</span>, " + fightResults[i].rounds;
					if(fightResults[i].rounds==1){
						resultText += " round";
					}
					else{
						resultText += " rounds";
					}
				}
				else{
					inconclusive++;
					resultText = "inconclusive";
				}

				var weaponName = "None";
				var specialName = "None";
				var aName = "noskill";
				var bName = "noskill";
				var cName = "noskill";
				var sName = "noskill";
				if(fightResults[i].enemy.weaponIndex != -1){
					weaponName = data.skills[fightResults[i].enemy.weaponIndex].name;
				}
				if(fightResults[i].enemy.specialIndex != -1){
					specialName = data.skills[fightResults[i].enemy.specialIndex].name;
				}
				if(fightResults[i].enemy.aIndex != -1){
					aName = data.skills[fightResults[i].enemy.aIndex].name.replace(/\s/g,"_");
				}
				if(fightResults[i].enemy.bIndex != -1){
					bName = data.skills[fightResults[i].enemy.bIndex].name.replace(/\s/g,"_");
				}
				if(fightResults[i].enemy.cIndex != -1){
					cName = data.skills[fightResults[i].enemy.cIndex].name.replace(/\s/g,"_");
				}
				if(fightResults[i].enemy.sIndex != -1){
					sName = data.skills[fightResults[i].enemy.sIndex].name.replace(/\s/g,"_");
				}

				var weaponTypeName = fightResults[i].enemy.weaponType;
				if(weaponTypeName == "dragon"){
					weaponTypeName = fightResults[i].enemy.color + "dragon";
				}

				resultHTML.push(["<div class=\"results_entry\" id=\"result_" + i + "\" onmouseover=\"showResultsTooltip(event,this);\" onmouseout=\"hideResultsTooltip();\">",
					"<div class=\"results_hpbox\">",
						"<div class=\"results_hplabel\">HP</div>",
						"<div class=\"results_hpnums\">",
							"<span class=\"results_challengerhp\">" + fightResults[i].challenger.hp + "</span> &ndash; <span class=\"results_enemyhp\">" + fightResults[i].enemyHp + "</span>",
						"</div>",
					"</div>",
					"<div class=\"frame_enemypicture\"><img class=\"results_enemypicture\" src=\"heroes/" + fightResults[i].enemy.name + ".png\"/></div>",
					"<div class=\"results_topline\">",
						"<img class=\"weaponIconSmall\" src=\"weapons/" + weaponTypeName + ".png\"/><span class=\"results_enemyname\">" + fightResults[i].enemy.name + "</span> (<span class=\"results_outcome\">" + resultText + "</span>)",
						"<div class=\"results_previousresult\">" + previousFightResults[fightResults[i].enemy.heroIndex] + "</div>",
					"</div>",
					"<div class=\"results_bottomline\">",
						"<span class=\"results_stat\">HP: " + fightResults[i].enemy.maxHp + "</span><span class=\"results_stat\">Atk: " + fightResults[i].enemy.atk + "</span><span class=\"results_stat\">Spd: " + fightResults[i].enemy.spd + "</span><span class=\"results_stat\">Def: " + fightResults[i].enemy.def + "</span><span class=\"results_stat\">Res: " + fightResults[i].enemy.res + "</span><div class=\"results_skills\"><span class=\"results_stat\"><img class=\"skill_picture\" src=\"skills/weapon.png\"/>" + weaponName + "</span><span class=\"results_stat\"><img class=\"skill_picture\" src=\"skills/special.png\"/>" + specialName + "</span><span class=\"results_stat\"><img class=\"skill_picture\" src=\"skills/" + aName + ".png\"/><img class=\"skill_picture\" src=\"skills/" + bName + ".png\"/><img class=\"skill_picture\" src=\"skills/" + cName + ".png\"/><img class=\"skill_picture\" src=\"skills/" + sName + ".png\"/></span></div>",
					"</div>",
				"</div>",""].join("\n"));

				//Set next previous result after showing this result
				nextPreviousFightResults[fightResults[i].enemy.heroIndex] = "Previous result: " + resultText + ", <span class=\"blue\">" + fightResults[i].challenger.hp + "</span> &ndash; <span class=\"red\">" + fightResults[i].enemyHp + "</span>";
			}

			outputResults();

			var total = wins + losses + inconclusive;
			$("#results_graph_wins").animate({"width":wins/total*906+"px"},200);
			$("#results_graph_losses").animate({"width":losses/total*906+"px"},200);
			$("#win_pct").html(wins);
			$("#lose_pct").html(losses);
			$("#inconclusive_pct").html(inconclusive);
		}
		else{
			$("#results_graph_wins").animate({"width":"0px"},200);
			$("#results_graph_losses").animate({"width":"0px"},200);
			$("#win_pct").html("-");
			$("#lose_pct").html("-");
			$("#inconclusive_pct").html("-");
			$("#results_list").html("");
		}
	}
}

function outputResults(){
	//function separate from calculation so user can re-sort without recalculating
	//sortOrder is 1 or -1
	//Hide results that aren't different if view is set to changed only
	//viewFilter is 0 or 1
	var sortOrder = parseInt($("#sort_results").val());
	var outputHTML = "";

	if(sortOrder==1){
		for(var i = 0; i < resultHTML.length; i++){
			if(filterResult(i)){
				outputHTML += resultHTML[i];
			}
		}
	}
	else if(sortOrder==-1){
		for(var i = resultHTML.length-1; i >= 0; i--){
			if(filterResult(i)){
				outputHTML += resultHTML[i];
			}
		}
	}
	$("#results_list").html(outputHTML);
}

//Helper function for filtering
//Will return true if include or false if not
function filterResult(i){
	if(!viewFilter){
		return true;
	}
	else{
		if(previousFightResults[i]==""){
			return false;
		}

		var enemyIndex = fightResults[i].enemy.heroIndex;

		var prevWin = previousFightResults[enemyIndex].includes("win");
		var prevLoss = previousFightResults[enemyIndex].includes("loss");
		var prevTie = previousFightResults[enemyIndex].includes("inconclusive");
		var sameResult = false;
		if((fightResults[i].challenger.hp==0 && prevLoss) || (fightResults[i].enemyHp==0 && prevWin) || (fightResults[i].challenger.hp!=0 && fightResults[i].enemyHp!=0 && prevTie)){
			sameResult = true;
		}

		if(viewFilter==1){//changed victor
			return !sameResult;
		}
		else if(viewFilter==2){//changed rounds
			var extractRounds =  previousFightResults[enemyIndex].match(/([1-4]) rounds?/);
			if(extractRounds){
				if(fightResults[i].rounds == extractRounds[1] || !sameResult){
					return false;
				}
				else{
					return true;
				}
			}
			else{
				//Don't show inconclusive because it's always max rounds
				return false;
			}
		}
	}
}

function showResultsTooltip(e,resultDiv){
	var resultId = resultDiv.id.substring(7);
	showingTooltip = true;
	$("#frame_tooltip").html(fightResults[resultId].fightText).show();
}

function hideResultsTooltip(){
	showingTooltip = false;
	$("#frame_tooltip").hide();
}

function addTurn(turnName){
	if(roundInitiators.length < 4){
		$("#turn_text_" + roundInitiators.length).html(turnName);
		$("#turn_" + roundInitiators.length).show();
		roundInitiators.push(turnName);
	}
	if(options.autoCalculate){
		calculate();
	}
}

function deleteTurn(initTurn){
	//keep ids the same, shift around text
	$("#turn_" + (roundInitiators.length - 1)).hide();
	roundInitiators.splice(initTurn,1);
	for(var i = 0; i < roundInitiators.length; i++){
		$("#turn_text_" + i).html(roundInitiators[i]);
	}
	if(options.autoCalculate){
		calculate();
	}
}

function verifyNumberInput(element,min,max){
	//contrains number between two values and returns it
	var newVal = parseInt($(element).val());
	if(!newVal){
		//If input is blank, make it 0
		newVal = 0;
		$(element).val(0);
	}
	if(newVal < min){
		$(element).val(min);
		newVal = min;
	}
	else if(newVal > max){
		$(element).val(max);
		newVal = max;
	}
	return newVal;
}

function resetChallenger(){
	$("#hero_atk_buff, #hero_spd_buff, #hero_def_buff, #hero_res_buff, #hero_atk_debuff, #hero_spd_debuff, #hero_def_debuff, #hero_res_debuff, #hero_atk_spur, #hero_spd_spur, #hero_def_spur, #hero_res_spur, #challenger_precharge, #challenger_merge, #challenger_damage").val(0);
	$("#challenger_rarity").val(5);
	//Set skills to default
	challenger.rarity = 5;
	setSkillOptions();
	resetChallengerSkills();

	$("#hero_boon_hp, #hero_boon_atk, #hero_boon_spd, #hero_boon_def, #hero_boon_res").attr("data-val",0).removeClass("bane").removeClass("boon").addClass("neutral").html("Neutral");

	challenger.damage = 0;
	challenger.precharge = 0;
	challenger.merge = 0;
	challenger.buffs = {"atk":0,"spd":0,"def":0,"res":0};
	challenger.debuffs = {"atk":0,"spd":0,"def":0,"res":0};
	challenger.spur = {"atk":0,"spd":0,"def":0,"res":0};
	
	setStats();
	setUI();

	if(options.autoCalculate){
		calculate();
	}
}

function resetChallengerSkills(){
	if(challenger.index != -1){
		challenger.weapon = heroMaxSkills[challenger.rarity-1][challenger.index].weapon;
		challenger.special = heroMaxSkills[challenger.rarity-1][challenger.index].special;
		challenger.a = heroMaxSkills[challenger.rarity-1][challenger.index].a;
		challenger.b = heroMaxSkills[challenger.rarity-1][challenger.index].b;
		challenger.c = heroMaxSkills[challenger.rarity-1][challenger.index].c;
	}
	else{
		challenger.weapon = -1;
		challenger.special = -1;
		challenger.a = -1;
		challenger.b = -1;
		challenger.c = -1;
	}
	challenger.s = -1;
	

	$("#hero_weapon").val(challenger.weapon);
	$("#hero_special").val(challenger.special);
	$("#hero_a").val(challenger.a);
	$("#hero_b").val(challenger.b);
	$("#hero_c").val(challenger.c);
	$("#hero_s").val(challenger.s);

	changeSkillPic("a",challenger.a);
	changeSkillPic("b",challenger.b);
	changeSkillPic("c",challenger.c);
	changeSkillPic("s",challenger.s);

}

function resetEnemies(){
	$("#enemies_atk_buff, #enemies_spd_buff, #enemies_def_buff, #enemies_res_buff, #enemies_atk_debuff, #enemies_spd_debuff, #enemies_def_debuff, #enemies_res_debuff, #enemies_atk_spur, #enemies_spd_spur, #enemies_def_spur, #enemies_res_spur, #enemies_weapon_overwrite, #enemies_special_overwrite, #enemies_a_overwrite, #enemies_b_overwrite, #enemies_c_overwrite, #enemies_merge, #enemies_damage").val(0);
	$("#enemies_rarity").val(5);
	$("#enemies_weapon").val(-1);
	$("#enemies_special").val(-1);
	$("#enemies_a").val(-1);
	$("#enemies_b").val(-1);
	$("#enemies_c").val(-1);
	$("#enemies_s").val(-1);

	enemies.fl.weapon = -1;
	enemies.fl.special = -1;
	enemies.fl.a = -1;
	enemies.b = -1;
	enemies.c = -1;
	enemies.s = -1;
	enemies.fl.rarity = 5;

	$("#enemies_boon_hp, #enemies_boon_atk, #enemies_boon_spd, #enemies_boon_def, #enemies_boon_res").attr("data-val",0).removeClass("bane").removeClass("boon").addClass("neutral");

	enemies.fl.damage = 0;
	enemies.fl.precharge = 0;
	enemies.fl.merge = 0;
	enemies.fl.buffs = {"atk":0,"spd":0,"def":0,"res":0};
	enemies.fl.debuffs = {"atk":0,"spd":0,"def":0,"res":0};
	enemies.fl.spur = {"atk":0,"spd":0,"def":0,"res":0};

	$(".wideincludebutton, .thinincludebutton").removeClass("notincluded").addClass("included");
	include = {"melee":1,"ranged":1,"red":1,"blue":1,"green":1,"gray":1,"physical":1,"magical":1,"infantry":1,"cavalry":1,"flying":1,"armored":1,"staff":0,"nonstaff":1};
	$("#include_staff").removeClass("included").addClass("notincluded");

	setEnemies();
	setEnemySkills();
	setEnemyStats();
	setUI();

	if(options.autoCalculate){
		calculate();
	}
}

function showImportDialog(side,type){
	//side = challenger or enemies, type = import or export
	var label = "";
	if(type=="import"){
		label = "Import ";
		$("#button_import").html("Import into calculator");
	}
	else{
		label = "Export ";
		$("#button_import").html("Copy to clipboard");
	}

	if(side=="challenger"){
		$("#frame_import").removeClass("enemiesimport").addClass("challengerimport");
		label += "challenger";
	}
	else if(side=="enemies"){
		$("#frame_import").removeClass("enemiesimport").addClass("enemiesimport");
		label += "enemies";
	}

	$("#import_title").html(label);
}

function hideImportDialog(){
	$("#screen_fade").hide();
	$("#frame_import").hide();
}

function switchEnemySelect(newVal){
	customEnemyList = newVal;
	if(customEnemyList==1){
		$("#enemies_full_list").hide();
		$("#enemies_custom_list").show();
	}
	else{
		$("#enemies_custom_list").hide();
		$("#enemies_full_list").show();
	}
}

function exportCalc(){
	//Exports all results to csv - doesn't take filters into account
	//If people complain, I will make it take the filters into account

	if(fightResults.length>0){
		var csvString = "data:text/csv;charset=utf-8,";

		//Column headers
		//Should take out buffs and stuff that aren't used to minimize columns?
		csvString += "Challenger,cColor,cMovetype,cWeapontype,cRarity,cMerge,cBoon,cBane,cMaxHP,cStartHP,cAtk,cSpd,cDef,cRes,cWeapon,cSpecial,cPrecharge,cA,cB,cC,cS,cBuffAtk,cBuffSpd,cBuffDef,cBuffRes,cDebuffAtk,cDebuffSpd,cDebuffDef,cDebuffRes,cSpurAtk,cSpurSpd,cSpurDef,cSpurRes,";
		csvString += "Enemy,eColor,eMovetype,eWeapontype,eRarity,eMerge,eBoon,eBane,eMaxHP,eStartHP,eAtk,eSpd,eDef,eRes,eWeapon,eSpecial,ePrecharge,eA,eB,eC,eS,eBuffAtk,eBuffSpd,eBuffDef,eBuffRes,eDebuffAtk,eDebuffSpd,eDebuffDef,eDebuffRes,eSpurAtk,eSpurSpd,eSpurDef,eSpurRes,";
		csvString += "FirstTurnThreaten,StartTurn,UseGaleforce,Initiator1,Initiator2,Initiator3,Initiator4,Outcome,cEndHP,eEndHP,Rounds,BattleLog\n";

		fightResults.forEach(function(result){
			csvString += data.heroes[challenger.index].name + ",";
			csvString += data.heroes[challenger.index].color + ",";
			csvString += data.heroes[challenger.index].movetype + ",";
			csvString += data.heroes[challenger.index].weapontype + ",";
			csvString += challenger.rarity + ",";
			csvString += challenger.merge + ",";
			csvString += challenger.boon + ",";
			csvString += challenger.bane + ",";
			csvString += challenger.hp + ",";
			csvString += Math.max(challenger.hp - challenger.damage,1) + ",";
			csvString += challenger.atk + ",";
			csvString += challenger.spd + ",";
			csvString += challenger.def + ",";
			csvString += challenger.res + ",";
			if(challenger.weapon != -1){
				csvString += data.skills[challenger.weapon].name + ",";
			}
			else{
				csvString += ",";
			}
			if(challenger.special != -1){
				csvString += data.skills[challenger.special].name + ",";
			}
			else{
				csvString += ",";
			}
			csvString += challenger.precharge + ",";
			if(challenger.a != -1){
				csvString += data.skills[challenger.a].name + ",";
			}
			else{
				csvString += ",";
			}
			if(challenger.b != -1){
				csvString += data.skills[challenger.b].name + ",";
			}
			else{
				csvString += ",";
			}
			if(challenger.c != -1){
				csvString += data.skills[challenger.c].name + ",";
			}
			else{
				csvString += ",";
			}
			if(challenger.s != -1){
				csvString += data.skills[challenger.s].name + ",";
			}
			else{
				csvString += ",";
			}
			csvString += challenger.buffs.atk + ",";
			csvString += challenger.buffs.spd + ",";
			csvString += challenger.buffs.def + ",";
			csvString += challenger.buffs.res + ",";
			csvString += challenger.debuffs.atk + ",";
			csvString += challenger.debuffs.spd + ",";
			csvString += challenger.debuffs.def + ",";
			csvString += challenger.debuffs.res + ",";
			csvString += challenger.spur.atk + ",";
			csvString += challenger.spur.spd + ",";
			csvString += challenger.spur.def + ",";
			csvString += challenger.spur.res + ",";

			var enemy = result.enemy;
			csvString += enemy.name + ",";
			csvString += enemy.color + ",";
			csvString += enemy.moveType + ",";
			csvString += enemy.weaponType + ",";
			csvString += enemy.rarity + ",";
			csvString += enemy.merge + ",";
			csvString += enemies.fl.boon + ",";
			csvString += enemies.fl.bane + ",";
			csvString += enemy.maxHp + ",";
			csvString += Math.max(enemy.maxHp - enemies.fl.damage,1) + ",";
			csvString += enemy.atk + ",";
			csvString += enemy.spd + ",";
			csvString += enemy.def + ",";
			csvString += enemy.res + ",";
			if(enemy.weaponIndex != -1){
				csvString += data.skills[enemy.weaponIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			if(enemy.specialIndex != -1){
				csvString += data.skills[enemy.specialIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			csvString += enemies.fl.precharge + ",";
			if(enemy.aIndex != -1){
				csvString += data.skills[enemy.aIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			if(enemy.bIndex != -1){
				csvString += data.skills[enemy.bIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			if(enemy.cIndex != -1){
				csvString += data.skills[enemy.cIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			if(enemy.sIndex != -1){
				csvString += data.skills[enemy.sIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			csvString += enemy.buffs.atk + ",";
			csvString += enemy.buffs.spd + ",";
			csvString += enemy.buffs.def + ",";
			csvString += enemy.buffs.res + ",";
			csvString += enemy.debuffs.atk + ",";
			csvString += enemy.debuffs.spd + ",";
			csvString += enemy.debuffs.def + ",";
			csvString += enemy.debuffs.res + ",";
			csvString += enemy.spur.atk + ",";
			csvString += enemy.spur.spd + ",";
			csvString += enemy.spur.def + ",";
			csvString += enemy.spur.res + ",";

			csvString += options.threatenRule + ",";
			csvString += options.startTurn + ",";
			csvString += options.useGaleforce + ",";
			for(var rnd = 0; rnd < 4;rnd++){
				if(!!roundInitiators[rnd]){
					csvString += roundInitiators[rnd].substring(0,roundInitiators[rnd].length-10) + ",";
				}
				else{
					csvString += ",";
				}
			}
			var outcome = "Inconclusive";
			if(result.challenger.hp==0){
				outcome = "Loss";
			}
			else if(result.enemyHp==0){
				outcome = "Win";
			}
			csvString += outcome + ",";
			csvString += result.challenger.hp + ",";
			csvString += result.enemyHp + ",";
			csvString += result.rounds + ",";
			var deTaggedLog = result.fightText.replace(/<br\/?>/g, "; ");
			deTaggedLog = deTaggedLog.replace(/<\/?[^>]+(>|$)/g, "");
			csvString += "\"" + deTaggedLog + "\"";

			csvString += "\n";
		});

		var encodedUri = encodeURI(csvString);
		var fakeLink = document.createElement("a");
		fakeLink.setAttribute("href", encodedUri);
		var date = new Date();
		fakeLink.setAttribute("download", "feh_simulator_" + (date.getYear()+1900) + "-" + date.getMonth() + "-" + date.getDate() + ".csv");
		document.body.appendChild(fakeLink);
		fakeLink.click();
	}
	else{
		alert("No results!");
	}
}

function addClEnemy(){
	var newCustomEnemyId = customEnemyList.length;
	var clEnemyHTML = "<div class=\"cl_enemy\" id=\"cl_enemy" + newCustomEnemyId + "\"><span id=\"cl_enemy" + newCustomEnemyId + "_name\">New enemy";
	clEnemyHTML += "</span><div class=\"cl_delete_enemy button\" id=\"cl_enemy" + newCustomEnemyId + "_delete\" onclick=\"deleteClEnemy(" + newCustomEnemyId + ");\">x</div></div>";
	$("#cl_enemylist_list").append(clEnemyHTML);
}

function deleteClEnemy(clEnemyId){

}

//activeHero is a class for simulating a unit in a battle
//This is where most of the calculations happen
//heroIndex is the index of the hero represented
//challenger is true if challenger, false if enemy
function activeHero(index,challenger){
	//If challenger, index is for heroes[]
	//Otherwise, index is for enemyData[]

	this.combatBuffs = {"atk":0,"spd":0,"def":0,"res":0};
	this.combatDebuffs = {"atk":0,"spd":0,"def":0,"res":0};
	this.combatSpur = {"atk":0,"spd":0,"def":0,"res":0};

	this.skillNames = [];

	if(challenger){

		this.challenger = true;
		this.heroIndex = index;
		this.name = data.heroes[index].name;
		this.rarity = challengerRarity;
		this.merge = challengerMerge;

		this.weaponIndex = challengerWeapon;	
		this.specialIndex = challengerSpecial;
		this.aIndex = challengerA;
		this.bIndex = challengerB;
		this.cIndex = challengerC;
		this.sIndex = challengerS;

		this.buffs = challengerBuffs;
		this.debuffs = challengerDebuffs;
		this.spur = challengerSpur;

		this.maxHp = challengerHp;
		this.atk = challengerAtk;
		this.spd = challengerSpd;
		this.def = challengerDef;
		this.res = challengerRes;

		this.moveType = data.heroes[index].movetype;
		this.weaponType = data.heroes[index].weapontype;
		this.color = data.heroes[index].color;

		this.hp = Math.max(this.maxHp - challengerDamage,1);
		this.precharge = 0 + challengerPrecharge;
		
	}
	else{

		this.challenger = false;
		this.heroIndex = enemyData[index].index;
		this.name = enemyData[index].name;
		this.rarity = enemyRarity;
		this.merge = enemiesMerge;

		this.weaponIndex = enemyData[index].weapon;	
		this.specialIndex = enemyData[index].special;
		this.aIndex = enemyData[index].a;
		this.bIndex = enemyData[index].b;
		this.cIndex = enemyData[index].c;
		this.sIndex = enemyData[index].s;

		this.buffs = enemyBuffs;
		this.debuffs = enemyDebuffs;
		this.spur = enemySpur;

		this.maxHp = enemyData[index].hp;
		this.atk = enemyData[index].atk;
		this.spd = enemyData[index].spd;
		this.def = enemyData[index].def;
		this.res = enemyData[index].res;

		this.moveType = enemyData[index].movetype;
		this.weaponType = enemyData[index].weapontype;
		this.color = enemyData[index].color;

		this.hp = Math.max(this.maxHp - enemyDamage,1);
		this.precharge = 0 + enemyPrecharge;

	}

	//Make a list of skill names for easy reference
	if(this.weaponIndex != -1){
		this.skillNames.push(data.skills[this.weaponIndex].name);
	}
	if(this.specialIndex != -1){
		this.skillNames.push(data.skills[this.specialIndex].name);
	}
	if(this.aIndex != -1){
		this.skillNames.push(data.skills[this.aIndex].name);
	}
	if(this.bIndex != -1){
		this.skillNames.push(data.skills[this.bIndex].name);
	}
	if(this.cIndex != -1){
		this.skillNames.push(data.skills[this.cIndex].name);
	}
	if(this.sIndex != -1){
		this.skillNames.push(data.skills[this.sIndex].name);
	}

	//Categorize weapon
	if(data.rangedWeapons.indexOf(this.weaponType)!=-1){
		this.range = "ranged";
	}
	else{
		this.range = "melee";
	}
	if(data.physicalWeapons.indexOf(this.weaponType)!=-1){
		this.attackType = "physical";
	}
	else{
		this.attackType = "magical";
	}

	this.charge = 0;
	this.initiator = false;
	this.panicked = false;
	this.didAttack = false;

	this.has = function(skill){
		//finds if hero has a skill that includes the string given
		//returns 1 if found, or a number 1-3 if level of skill is found
		//For exact matches, see "hasExactly"
		var index = -1;

		for(var i = 0; i < this.skillNames.length; i++){
			if(this.skillNames[i].includes(skill)){
				index = i;
			}
		}

		if(index != -1){
			if($.isNumeric(this.skillNames[index].charAt(this.skillNames[index].length-1))){
				return parseInt(this.skillNames[index].charAt(this.skillNames[index].length-1));
			}
			else{
				return 1;
			}
		}
		else{
			return 0;
		}
	}

	this.hasExactly = function(skill){
		//finds if hero has a skill with an exact name
		//returns true if found
		for(var i = 0; i < this.skillNames.length; i++){
			if(this.skillNames[i] == skill){
				return true;
			}
		}

		return false;
	}

	this.resetCharge = function(){
		//resets charge based on weapon
		if(this.has("Killing Edge") || this.has("Killer Axe") || this.has("Killer Lance") || this.has("Mystletainn") || this.has("Hauteclere") || this.has("Killer Bow")){
			this.charge = 1;
		}
		else if(this.has("Raudrblade") || this.has("Lightning Breath") || this.has("Blarblade") || this.has("Gronnblade")){
			this.charge = -1;
		}
		else{
			this.charge = 0;
		}
	}

	//Set charge at beginning
	this.resetCharge();
	this.charge += this.precharge;

	this.threaten = function(enemy){
		//Thhhhhhhhrreats!
		var threatenText = "";
		var skillName = "";

		var debuffAtk = 0;
		if(this.has("Threaten Atk")){
			debuffAtk = -this.has("Threaten Atk")-2;
			skillName = data.skills[this.cIndex].name;
		}
		if(this.has("Fensalir")){
			if(debuffAtk > -4){
				debuffAtk = -4;
				skillName = data.skills[this.weaponIndex].name;
			}
		}
		if(debuffAtk < enemy.combatDebuffs.atk){
			enemy.combatDebuffs.atk = debuffAtk;
			threatenText += this.name + " activates " + skillName + ", giving " + enemy.name + " " + enemy.combatDebuffs.atk + " atk.<br>";
		}

		var debuffSpd = 0;
		if(this.has("Threaten Spd")){
			debuffSpd = -this.has("Threaten Spd")-2;
			skillName = data.skills[this.cIndex].name;
		}
		if(debuffSpd < enemy.combatDebuffs.spd){
			enemy.combatDebuffs.spd = debuffSpd;
			threatenText += this.name + " activates " + skillName + ", giving " + enemy.name + " " + enemy.combatDebuffs.spd + " spd.<br>";
		}

		var debuffDef = 0;
		if(this.has("Threaten Def")){
			debuffDef = -this.has("Threaten Def")-2;
			skillName = data.skills[this.cIndex].name;
		}
		if(this.has("Eckesachs")){
			if(debuffDef > -4){
				debuffDef = -4;
				skillName = data.skills[this.weaponIndex].name;
			}
		}
		if(debuffDef < enemy.combatDebuffs.def){
			enemy.combatDebuffs.def = debuffDef;
			threatenText += this.name + " activates " + skillName + ", giving " + enemy.name + " " + enemy.combatDebuffs.def + " def.<br>";
		}

		var debuffRes = 0;
		if(this.has("Threaten Res")){
			debuffRes = -this.has("Threaten Res")-2;
			skillName = data.skills[this.cIndex].name;
		}
		if(debuffRes < enemy.combatDebuffs.res){
			enemy.combatDebuffs.res = debuffRes;
			threatenText += this.name + " activates " + skillName + ", giving " + enemy.name + " " + enemy.combatDebuffs.res + " res.<br>";
		}

		return threatenText;	
	}

	this.renew = function(turn){
		var renewText = "";
		var renewalTurn = 0;
		if(this.has("Renewal")){
			renewalTurn = 5 - this.has("Renewal");
		}
		if(this.has("Falchion") && renewalTurn > 3){
			renewalTurn = 3;
		}

		if(renewalTurn != 0){
			if(turn % renewalTurn == 0){
				var renewalHp = 10;
				if(this.hp + renewalHp > this.maxHp){
					renewalHp = this.maxHp - this.hp;
				}
				this.hp += renewalHp;
				renewText += "Renewal: " + this.name + " heals " + renewalHp + "HP.<br>";
			}
		}

		return renewText;
	}

	this.defiant = function(){
		var defiantText = "";

		//All defiant sklls trigger at or below 50% HP
		if(this.hp / this.maxHp <= 0.5){
			var skillName = "";

			var defiantAtk = 0;
			if(this.has("Defiant Atk")){
				defiantAtk = this.has("Defiant Atk") * 2 + 1;
				skillName = data.skills[this.aIndex].name;
			}
			if(this.has("Folkvangr")){
				if(defiantAtk<5){
					defiantAtk = 5;
					skillName = data.skills[this.weaponIndex].name;
				}
			}
			if(defiantAtk > this.combatBuffs.atk){
				this.combatBuffs.atk = defiantAtk;
				defiantText += this.name + " activates " + skillName + " for +" + defiantAtk + " atk.<br>";
			}

			var defiantSpd = 0;
			if(this.has("Defiant Spd")){
				defiantSpd = this.has("Defiant Spd") * 2 + 1;
				skillName = data.skills[this.aIndex].name;
			}
			if(defiantSpd > this.combatBuffs.spd){
				this.combatBuffs.spd = defiantSpd;
				defiantText += this.name + " activates " + skillName + " for +" + defiantSpd + " spd.<br>";
			}

			var defiantDef = 0;
			if(this.has("Defiant Def")){
				defiantDef = this.has("Defiant Def") * 2 + 1;
				skillName = data.skills[this.aIndex].name;
			}
			if(defiantDef > this.combatBuffs.def){
				this.combatBuffs.def = defiantDef;
				defiantText += this.name + " activates " + skillName + " for +" + defiantDef + " def.<br>";
			}

			var defiantRes = 0;
			if(this.has("Defiant Res")){
				defiantRes = this.has("Defiant Res") * 2 + 1;
				skillName = data.skills[this.aIndex].name;
			}
			if(defiantRes > this.combatBuffs.res){
				this.combatBuffs.res = defiantRes;
				defiantText += this.name + " activates " + skillName + " for +" + defiantRes + " res.<br>";
			}
		}
		return defiantText;
	}

	this.blow = function(){
		var blowText = "";
		var skillName = "";

		var blowAtk = 0;
		if(this.has("Death Blow")){
			blowAtk = this.has("Death Blow") * 2;
			skillName = data.skills[this.aIndex].name;
			this.combatSpur.atk += blowAtk;
			blowText += this.name + " gets +" + blowAtk + " atk from initiating with " + skillName + ".<br>";
		}
		if(this.has("Swift Sparrow")){
			blowAtk = this.has("Swift Sparrow") * 2;
			skillName = data.skills[this.aIndex].name;
			this.combatSpur.atk += blowAtk;
			blowText += this.name + " gets +" + blowAtk + " atk from initiating with " + skillName + ".<br>";
		}
		if(this.has("Durandal")){
			this.combatSpur.atk += 4;
			blowText += this.name + " gets +4 atk from initiating with Durandal.<br>";
		}

		var blowSpd = 0;
		if(this.has("Darting Blow")){
			blowSpd = this.has("Darting Blow") * 2;
			skillName = data.skills[this.aIndex].name;
			this.combatSpur.spd += blowSpd;
			blowText += this.name + " gets " + blowSpd + " spd from initiating with " + skillName + ".<br>";
		}
		if(this.has("Swift Sparrow")){
			blowSpd = this.has("Swift Sparrow") * 2;
			skillName = data.skills[this.aIndex].name;
			this.combatSpur.spd += blowSpd;
			blowText += this.name + " gets +" + blowSpd + " spd from initiating with " + skillName + ".<br>";
		}
		if(this.has("Yato")){
			this.combatSpur.spd += 4;
			blowText += this.name + " gets +4 spd from initiating with Yato.<br>";
		}

		var blowDef = 0;
		if(this.has("Armored Blow")){
			blowDef = this.has("Armored Blow") * 2;
			skillName = data.skills[this.aIndex].name;
			this.combatSpur.def += blowDef;
			blowText += this.name + " gets " + blowDef + " def from initiating with " + skillName + ".<br>";
		}
		if(this.has("Tyrfing") && this.hp / this.maxHp <= 0.5){
			this.combatSpur.def += 4;
			blowText += this.name + " gets +4 def from Tyrfing.<br>";
		}

		var blowRes = 0;
		if(this.has("Warding Blow")){
			blowRes = this.has("Warding Blow") * 2;
			skillName = data.skills[this.aIndex].name;
			this.combatSpur.res += blowRes;
			blowText += this.name + " gets " + blowRes + " res from initiating with " + skillName + ".<br>";
		}
		if(this.has("Parthia")){
			this.combatSpur.res += 4;
			blowText += this.name + " gets +4 res from initiating with Parthia.<br>";
		}

		return blowText;
	}

	this.defendBuff = function(relevantDefType){
		var defendBuffText = "";
		//Not actually going to limit text from relevantDefType, beccause res/def may always be relevant for special attacks
		if(this.has("Binding Blade") || this.has("Naga")){
			this.combatSpur.def += 2;
			this.combatSpur.res += 2;
			defendBuffText += this.name + " gets +2 def and res while defending with " + data.skills[this.weaponIndex].name + ".<br>";
		}
		if(this.has("Tyrfing") && this.hp / this.maxHp <= 0.5){
			this.combatSpur.def += 4;
			defendBuffText += this.name + " gets +4 def from Tyrfing.<br>";
		}

		return defendBuffText;
	}

	//poison only happens when the user initiates
	this.poisonEnemy = function(enemy){	
		var poisonEnemyText ="";
		var skillName = "";

		var poison = 0;
		if(this.has("Poison Strike")){
			poison = this.has("Poison Strike")*3+1;
			skillName = data.skills[this.bIndex].name;
			if(enemy.hp - poison <= 0){
				poison = enemy.hp - 1;
			}
			enemy.hp -= poison;
			poisonEnemyText += enemy.name + " takes " + poison + " damage after combat from " + skillName + ".<br>";
		}
		if(this.has("Deathly Dagger")){
			poison = 7;
			skillName = data.skills[this.weaponIndex].name;
			if(enemy.hp - poison <= 0){
				poison = enemy.hp - 1;
			}
			enemy.hp -= poison;
			poisonEnemyText += enemy.name + " takes " + poison + " damage after combat from " + skillName + ".<br>";
		}

		return poisonEnemyText;
	}

	//Pain and fury happen after every combat regardless of initiator
	//They could be put into one function, but separating them is easier to make sense of
	this.painEnemy = function(enemy){
		var painEnemyText = "";

		//Pain only takes place when the unit performs an attack in the round
		if(this.has("Pain") && this.didAttack){
			var painDmg = 10;
			if(enemy.hp - painDmg <= 0){
				painDmg = enemy.hp - 1;
			}
			enemy.hp -= painDmg;
			painEnemyText += enemy.name + " takes " + painDmg + " damage after combat from Pain.<br>";
		}

		return painEnemyText;
	}

	this.fury = function(){
		var furyText = "";

		var skillName = "";

		var furyDmg = 0;
		if(this.has("Fury")){
			furyDmg = this.has("Fury") * 2;
			skillName = data.skills[this.aIndex].name;
		}
		if(furyDmg > 0){
			if(this.hp - furyDmg <= 0){
				furyDmg = this.hp - 1;
			}
			this.hp -= furyDmg;
			furyText += this.name + " takes " + furyDmg + " damage after combat from " + skillName + ".<br>";
		}

		return furyText;
	}

	this.seal = function(enemy){
		var sealText = "";

		var skillName = "";

		var sealAtk = 0;
		if(this.has("Seal Atk")){
			sealAtk = -this.has("Seal Atk") * 2 - 1;
			skillName = data.skills[this.bIndex].name;
		}
		if(this.has("Fear") && sealAtk > -6){
			sealAtk = -6;
			skillName = data.skills[this.weaponIndex].name;
		}
		if(sealAtk < enemy.combatDebuffs.atk){
			enemy.combatDebuffs.atk = sealAtk;
			sealText += this.name + " lowers " + enemy.name + "'s atk by " + (-sealAtk) + " after combat with " + skillName + ".<br>";
		}

		var sealSpd = 0;
		if(this.has("Seal Spd")){
			sealSpd = -this.has("Seal Spd") * 2 - 1;
			skillName = data.skills[this.bIndex].name;
		}
		if(this.has("Slow") && sealSpd > -6){
			sealSpd = -6;
			skillName = data.skills[this.weaponIndex].name;
		}
		if(sealSpd < enemy.combatDebuffs.spd){
			enemy.combatDebuffs.spd = sealSpd;
			sealText += this.name + " lowers " + enemy.name + "'s spd by " + (-sealSpd) + " after combat with " + skillName + ".<br>";
		}

		var sealDef = 0;
		if(this.has("Seal Def")){
			sealDef = -this.has("Seal Def") * 2 - 1;
			skillName = data.skills[this.bIndex].name;
		}
		//Daggers only take effect if the unit performed an attack
		if(this.didAttack){
			if((this.hasExactly("Silver Dagger+") || this.hasExactly("Deathly Dagger")) && sealDef > -7){
				sealDef = -7;
				skillName = data.skills[this.weaponIndex].name;
			}
			else if((this.hasExactly("Silver Dagger") || this.hasExactly("Rogue Dagger+")) && sealDef > -5){
				sealDef = -5;
				skillName = data.skills[this.weaponIndex].name;
			}
			else if((this.hasExactly("Iron Dagger") || this.hasExactly("Steel Dagger") || this.hasExactly("Rogue Dagger")) && sealDef > -3){
				sealDef = -3;
				skillName = data.skills[this.weaponIndex].name;
			}
			else if(this.hasExactly("Poison Dagger+") && sealDef > -6 && enemy.moveType == "infantry"){
				sealDef = -6;
				skillName = data.skills[this.weaponIndex].name;
			}
			else if(this.hasExactly("Poison Dagger") && sealDef > -4 && enemy.moveType == "infantry"){
				sealDef = -4;
				skillName = data.skills[this.weaponIndex].name;
			}
		}
		if(sealDef < enemy.combatDebuffs.def){
			enemy.combatDebuffs.def = sealDef;
			sealText += this.name + " lowers " + enemy.name + "'s def by " + (-sealDef) + " after combat with " + skillName + ".<br>";
		}

		var sealRes = 0;
		if(this.has("Seal Res")){
			sealRes = -this.has("Seal Res") * 2 - 1;
			skillName = data.skills[this.bIndex].name;
		}
		//Daggers only take effect if the unit performed an attack
		if(this.didAttack){
			if((this.hasExactly("Silver Dagger+") || this.hasExactly("Deathly Dagger")) && sealRes > -7){
				sealRes = -7;
				skillName = data.skills[this.weaponIndex].name;
			}
			else if((this.hasExactly("Silver Dagger") || this.hasExactly("Rogue Dagger+")) && sealRes > -5){
				sealRes = -5;
				skillName = data.skills[this.weaponIndex].name;
			}
			else if((this.hasExactly("Iron Dagger") || this.hasExactly("Steel Dagger") || this.hasExactly("Rogue Dagger")) && sealRes > -3){
				sealRes = -3;
				skillName = data.skills[this.weaponIndex].name;
			}
			else if(this.hasExactly("Poison Dagger+") && sealRes > -6 && enemy.moveType == "infantry"){
				sealRes = -6;
				skillName = data.skills[this.weaponIndex].name;
			}
			else if(this.hasExactly("Poison Dagger") && sealRes > -4 && enemy.moveType == "infantry"){
				sealRes = -4;
				skillName = data.skills[this.weaponIndex].name;
			}
		}
		if(sealRes < enemy.combatDebuffs.res){
			enemy.combatDebuffs.res = sealRes;
			sealText += this.name + " lowers " + enemy.name + "'s res by " + (-sealRes) + " after combat with " + skillName + ".<br>";
		}

		return sealText;
	}

	this.postCombatBuff = function(){
		var postCombatBuffText = "";

		//Daggers only take effect if the unit performed an attack
		if(this.didAttack){
			var skillName = "";

			//Will need to split these up if there comes another thing which boosts def or res after combat
			var buffDef = 0;
			var buffRes = 0;
			if(this.hasExactly("Rogue Dagger+")){
				buffDef = 5;
				buffRes = 5;
				skillName = data.skills[this.weaponIndex].name;
			}
			else if(this.hasExactly("Rogue Dagger")){
				buffDef = 3;
				buffRes = 3;
				skillName = data.skills[this.weaponIndex].name;
			}

			if(buffDef > this.combatBuffs.def){
				this.combatBuffs.def = buffDef;
				postCombatBuffText += this.name + " gains " + buffDef + " def after combat from " + skillName + ".<br>";
			}
			if(buffRes > this.combatBuffs.res){
				this.combatBuffs.res = buffRes;
				postCombatBuffText += this.name + " gains " + buffRes + " res after combat from " + skillName + ".<br>";
			}
		}

		return postCombatBuffText;
	}

	this.postCombatHeal = function(){
		var postCombatHealText = "";

		if(this.initiator){
			var skillname = "";
			
			if(this.has("Blue Egg") || this.has("Green Egg") || this.has("Carrot Axe") || this.has("Carrot Lance")){
				skillName = data.skills[this.weaponIndex].name;
				var healAmount = 4;
				if(this.maxHp - this.hp < healAmount){
					healAmount = this.maxHp - this.hp;
				}
				if(healAmount > 0){
					this.hp += healAmount;
					postCombatHealText += this.name + " heals " + healAmount + " hp with " + skillName + ".<br>";
				}
			}
		}

		return postCombatHealText;
	}

	//represents one attack of combat
	this.doDamage = function(enemy,brave,AOE){
		//didAttack variable for checking daggers and pain
		this.didAttack = true;

		var enemyDefModifier = 0;
		var effectiveBonus = 1.0;
		var dmgMultiplier = 1.0;
		var dmgBoost = 0;
		var absorbPct = 0;

		var damageText = "";

		var thisEffAtk = this.atk + Math.max(this.buffs.atk,this.combatBuffs.atk) + Math.min(this.debuffs.atk,this.combatDebuffs.atk) + this.spur.atk + this.combatSpur.atk;
		var thisEffDef = this.def + Math.max(this.buffs.def,this.combatBuffs.def) + Math.min(this.debuffs.def,this.combatDebuffs.def) + this.spur.def + this.combatSpur.def;
		var thisEffRes = this.res + Math.max(this.buffs.res,this.combatBuffs.res) + Math.min(this.debuffs.res,this.combatDebuffs.res) + this.spur.res + this.combatSpur.res;
		var enemyEffAtk = enemy.atk + Math.max(enemy.buffs.atk,enemy.combatBuffs.atk) + Math.min(enemy.debuffs.atk,enemy.combatDebuffs.atk) + enemy.spur.atk + enemy.combatSpur.atk;
		var enemyEffDef = enemy.def + Math.max(enemy.buffs.def,enemy.combatBuffs.def) + Math.min(enemy.debuffs.def,enemy.combatDebuffs.def) + enemy.spur.def + enemy.combatSpur.def;
		var enemyEffRes = enemy.res + Math.max(enemy.buffs.res,enemy.combatBuffs.res) + Math.min(enemy.debuffs.res,enemy.combatDebuffs.res) + enemy.spur.res + enemy.combatSpur.res;

		if(this.panicked){
			thisEffAtk = this.atk - Math.max(this.buffs.atk,this.combatBuffs.atk) - Math.min(this.debuffs.atk,this.combatDebuffs.atk) + this.spur.atk + this.combatSpur.atk;
			thisEffDef = this.def - Math.max(this.buffs.def,this.combatBuffs.def) - Math.min(this.debuffs.def,this.combatDebuffs.def) + this.spur.def + this.combatSpur.def;
			thisEffRes = this.res - Math.max(this.buffs.res,this.combatBuffs.res) - Math.min(this.debuffs.res,this.combatDebuffs.res) + this.spur.res + this.combatSpur.res;
		}

		if(enemy.panicked){
			enemyEffDef = enemy.def - Math.max(enemy.buffs.def,enemy.combatBuffs.def) - Math.min(enemy.debuffs.def,enemy.combatDebuffs.def) + enemy.spur.def + enemy.combatSpur.def;
			enemyEffRes = enemy.res - Math.max(enemy.buffs.res,enemy.combatBuffs.res) - Math.min(enemy.debuffs.res,enemy.combatDebuffs.res) + enemy.spur.res + enemy.combatSpur.res;
		}

		var relevantDef = enemyEffDef;
		if(this.attackType=="magical"){
			relevantDef = enemyEffRes;
		}

		var offensiveSpecialActivated = false;

		if(this.specialIndex!=-1&&data.skills[this.specialIndex].charge<=this.charge){

			//Do AOE specials
			if(AOE){
				var AOEActivated = false;
				var AOEDamage = 0;
				//AOE specials don't take spur into effect
				var AOEthisEffAtk = thisEffAtk - this.spur.atk - this.combatSpur.atk;

				if(this.has("Rising Thunder") || this.has("Rising Wind") || this.has("Rising Light") || this.has("Rising Flame") || this.has("Growing Thunder") || this.has("Growing Wind") || this.has("Growing Light") || this.has("Growing Flame")){
					AOEDamage = AOEthisEffAtk - relevantDef;
				}
				else if(this.has("Blazing Thunder") || this.has("Blazing Wind") || this.has("Blazing Light") || this.has("Blazing Flame")){
					AOEDamage = Math.floor(1.5*(AOEthisEffAtk - relevantDef));
				}

				if(AOEDamage > 0){
					AOEActivated = true;
					if(enemy.hp - AOEDamage < 1){
						AOEDamage = enemy.hp - 1;
					}
					this.resetCharge();
					enemy.hp -= AOEDamage;
					damageText += "Before combat, " + this.name + " hits with " + data.skills[this.specialIndex].name + " for " + AOEDamage + ".<br>";
				}
			}
			else{

				//special will fire if it's an attacking special
				if(this.has("Night Sky") || this.has("Glimmer")){
					dmgMultiplier = 1.5;
					offensiveSpecialActivated = true;
				}
				else if(this.has("Astra")){
					dmgMultiplier = 2.5;
					offensiveSpecialActivated = true;
				}
				else if(this.has("Dragon Gaze") || this.has("Draconic Aura")){
					//Works like Ignis and Glacies
					dmgBoost += thisEffAtk * 0.3;
					offensiveSpecialActivated = true;
				}
				else if(this.has("Dragon Fang")){
					dmgBoost += thisEffAtk * 0.5;
					offensiveSpecialActivated = true;
				}
				else if(this.has("Glowing Ember") || this.has("Bonfire")){
					dmgBoost += thisEffDef/2;
					offensiveSpecialActivated = true;
				}
				else if(this.has("Ignis")){
					dmgBoost += thisEffDef * 0.8;
					offensiveSpecialActivated = true;
				}
				else if(this.has("Daylight") || this.has("Noontime")){
					absorbPct = 0.3;
					offensiveSpecialActivated = true;
				}
				else if(this.hasExactly("Sol")){
					absorbPct = 0.5;
					offensiveSpecialActivated = true;
				}
				else if(this.has("New Moon") || this.has("Moonbow")){
					enemyDefModifier = -0.3;
					offensiveSpecialActivated = true;
				}
				else if(this.has("Luna")){
					enemyDefModifier = -0.5;
					offensiveSpecialActivated = true;
				}
				else if(this.has("Chilling Wind") || this.has("Iceberg")){
					dmgBoost += thisEffRes/2;
					offensiveSpecialActivated = true;
				}
				else if(this.has("Glacies")){
					dmgBoost += thisEffRes*0.8;
					offensiveSpecialActivated = true;
				}
				else if(this.has("Retribution") || this.has("Reprisal")){
					dmgBoost += (this.maxHp-this.hp)*0.3;
					offensiveSpecialActivated = true;
				}
				else if(this.has("Vengeance")){
					dmgBoost += (this.maxHp-this.hp)*0.5;
					offensiveSpecialActivated = true;
				}
				else if(this.has("Aether")){
					enemyDefModifier = -0.5;
					absorbPct = 0.5;
					offensiveSpecialActivated = true;
				}
			}

			if(offensiveSpecialActivated){
				this.resetCharge();
				damageText += this.name + " activates " + data.skills[this.specialIndex].name + ". ";

				if(this.has("Wo Dao")){
					dmgBoost += 10;
					damageText += this.name + " gains 10 damage from Wo Dao. ";
					//Does damage boost on AOE skills take effect on attack or AOE?
				}
			}
		}

		//Don't do anything else if it's just an AOE attack
		if(!AOE){
		
			//Check weapon advantage
			//0 is no advantage, 1 is attacker advantage, -1 is defender advantage
			var weaponAdvantage = 0;

			if((enemy.color=="green"&&this.color=="red")||(enemy.color=="red"&&this.color=="blue")||(enemy.color=="blue"&&this.color=="green")){
				weaponAdvantage = 1;
			}
			else if(enemy.color=="gray" && (this.has("Raudrraven") || this.has("Blarraven") || this.has("Gronnraven"))){
				weaponAdvantage = 1;
			}
			else if((this.color=="green"&&enemy.color=="red")||(this.color=="red"&&enemy.color=="blue")||(this.color=="blue"&&enemy.color=="green")){
				weaponAdvantage = -1;
			}
			else if(this.color=="gray" && (enemy.has("Raudrraven") || enemy.has("Blarraven") || enemy.has("Gronnraven"))){
				weaponAdvantage = -1;
			}

			//Extra weapon advantage is apparently limited to 0.2 more (doesn't stack)
			var extraWeaponAdvantage = 0;
			if(weaponAdvantage != 0){
				if(this.has("Ruby Sword") || this.has("Sapphire Lance") || this.has("Emerald Axe") || enemy.has("Ruby Sword") || enemy.has("Sapphire Lance") || enemy.has("Emerald Axe")){
					extraWeaponAdvantage = 0.2;
				}
				else{
					if(this.has("Triangle Adept")){
						extraWeaponAdvantage = 0.05 + 0.05 * this.has("Triangle Adept");
					}
					if(enemy.has("Triangle Adept")){
						extraWeaponAdvantage = Math.max(extraWeaponAdvantage,0.05 + 0.05 * enemy.has("Triangle Adept"));
					}
				}	
			}

			var weaponAdvantageBonus = (0.2 + extraWeaponAdvantage) * weaponAdvantage;
			
			if(weaponAdvantage != 0){
				damageText += this.name + "'s attack is multiplied by " + Math.round((1+weaponAdvantageBonus)*10)/10 + " because of weapon advantage. ";
			}

			//Check weapon effective against
			var effectiveBonus = 1;
			if(!(enemy.has("Svalinn Shield") || enemy.has("Iote's Shield"))){
				if(enemy.moveType == "armored" && (this.has("Hammer") || this.has("Armorslayer") || this.has("Heavy Spear"))){
					effectiveBonus = 1.5;
				}
				else if(enemy.moveType == "flying" && (this.has("Excalibur") || this.weaponType=="bow")){
					effectiveBonus = 1.5;
				}
				else if(enemy.moveType == "infantry" && (this.has("Poison Dagger"))){
					effectiveBonus = 1.5;
				}
				else if(enemy.moveType == "cavalry" && (this.has("Raudrwolf") || this.has("Blarwolf") || this.has("Gronnwolf"))){
					effectiveBonus = 1.5;
				}
				else if(enemy.weaponType == "dragon" && (this.has("Falchion") || this.has("Naga"))){
					effectiveBonus = 1.5;
				}

				if(effectiveBonus > 1 ){
					damageText += this.name + "'s attack is multiplied by " + effectiveBonus + " from weapon effectiveness. ";
				}
			}

			//blade tomes
			if(this.has("Raudrblade") || this.has("Blarblade") || this.has("Gronnblade")){
				var bladeDmg = Math.max(this.buffs.atk,this.combatBuffs.atk) + Math.max(this.buffs.spd,this.combatBuffs.spd) + Math.max(this.buffs.def,this.combatBuffs.def) + Math.max(this.buffs.res,this.combatBuffs.res);
				if(bladeDmg > 0){
					damageText += this.name + " gets " + bladeDmg + " extra attack from a blade tome. ";
					thisEffAtk += bladeDmg;
				}
			}

			//Check damage reducing specials
			var defensiveSpecialActivated = false;
			var dmgReduction = 1.0;
			var miracle = false;
			if(enemy.specialIndex!=-1&&data.skills[enemy.specialIndex].charge<=enemy.charge){
				//gotta check range
				var anyRangeCounter = false;
				if(this.has("Close Counter") || this.has("Distant Counter") || this.has("Raijinto") || this.has("Lightning Breath") || this.has("Siegfried") || this.has("Ragnell")){
					anyRangeCounter = true;
				}

				if(this.range == "melee" || (!this.initiator && enemy.range == "melee" && anyRangeCounter)){
					if(enemy.has("Buckler") || enemy.has("Escutcheon")){
						dmgReduction = 0.7;
						defensiveSpecialActivated = true;
					}
					else if(enemy.has("Pavise")){
						dmgReduction = 0.5;
						defensiveSpecialActivated = true;
					}
				}
				else if(this.range == "ranged" || (!this.initiator && enemy.range == "ranged" && anyRangeCounter)){
					if(enemy.has("Holy Vestments") || enemy.has("Sacred Cowl")){
						dmgReduction = 0.7;
						defensiveSpecialActivated = true;
					}
					else if(enemy.has("Aegis")){
						dmgReduction = 0.5;
						defensiveSpecialActivated = true;
					}
				}

				if(enemy.has("Miracle") && enemy.hp > 1){
					miracle = true;
				}
			}

			if(defensiveSpecialActivated){
				if(dmgReduction < 1){
					damageText += enemy.name + " multiplies damage by " + dmgReduction + " with " + data.skills[enemy.specialIndex].name + ". ";
				}
				enemy.resetCharge();
			}

			//Weapon mod for healers
			var weaponModifier = 1;
			if(this.weaponType == "staff"){
				//poor healers
				weaponModifier = 0.5;
			}

			if(this.has("Absorb")){
				absorbPct = 0.5;
			}

			//Damage calculation from http://feheroes.wiki/Damage_Calculation
			//use bitwise or to truncate properly
			//Doing calculation in steps to see the formula more clearly
			var rawDmg = (thisEffAtk*effectiveBonus | 0) + ((thisEffAtk*effectiveBonus | 0)*weaponAdvantageBonus | 0) + (dmgBoost | 0);
			var reduceDmg = relevantDef + (relevantDef*enemyDefModifier | 0);
			var dmg = (rawDmg - reduceDmg)*weaponModifier | 0;
			dmg = (dmg*dmgMultiplier | 0) - (dmg*(1-dmgReduction) | 0);
			dmg = Math.max(dmg,0);
			damageText += this.name + " attacks " + enemy.name + " for <span class=\"bold\">" + dmg + "</span> damage.<br>";
			dmg = Math.min(dmg,enemy.hp);
			enemy.hp -= dmg;

			if(enemy.hp <= 0 && miracle){
				enemy.hp = 1;
				defensiveSpecialActivated = true;
				enemy.resetCharge();
				damageText += enemy.name + " survives with 1HP with Miracle.<br>";
			}

			//add absorbed hp
			var absorbHp = dmg*absorbPct | 0;
			if(this.hp + absorbHp > this.maxHp){
				absorbHp = this.maxHp - this.hp;
			}
			this.hp += absorbHp;
			if(absorbHp > 0){
				damageText += this.name + " absorbs " + absorbHp + ".<br>";
			}

			//Special charge does not increase if special was used on this attack
			if(!offensiveSpecialActivated){
				var heavyBlade = 0;
				if(this.has("Heavy Blade")){
					heavyBlade = this.has("Heavy Blade")*-2 + 7;
				}
				if(heavyBlade && thisEffAtk - enemyEffAtk >= heavyBlade){
					this.charge++;
				}

				var guard = 0;
				if(enemy.has("Guard")){
					guard = 1.1 - enemy.has("Guard")*0.1;
				}
				if(guard && enemy.combatStartHp / enemy.maxHp >= guard){
					this.charge--;
				}

				this.charge++;
			}

			if(!defensiveSpecialActivated){
				var guard = 0;
				if(this.has("Guard")){
					guard = 1.1 - this.has("Guard")*0.1;
				}
				if(guard && this.combatStartHp / this.maxHp >= guard){
					enemy.charge--;
				}

				enemy.charge++;
			}

			//show hp
			//Make sure challenger is first and in blue
			if(this.challenger){
				damageText += this.name + " <span class=\"blue\">" + this.hp + "</span> : " + enemy.name + " <span class=\"red\">" + enemy.hp + "</span><br>";
			}
			else{
				damageText += enemy.name + " <span class=\"blue\">" + enemy.hp + "</span> : " + this.name + " <span class=\"red\">" + this.hp + "</span><br>";
			}
		

			//do damage again if brave weapon
			if(brave && enemy.hp > 0){
				damageText += this.name + " attacks again with a brave weapon.<br>";
				damageText += this.doDamage(enemy);
			}
		}

		return damageText;
	}

	//represents a full round of combat
	this.attack = function(enemy,turn,galeforce){

		var roundText = "";//Common theme: text is returned by helper functions, so the functions are called by adding them to roundText
		var firstTurn = (turn - startTurn == 0);
		this.initiator = true;
		enemy.initiator = false;
		enemy.didAttack = false;
		this.combatStartHp = this.hp;
		enemy.combatStartHp = enemy.hp;

		//Get relevant defense for simplified text output
		var relevantDefType = "def";
		if(enemy.attackType=="magical"){
			relevantDefType = "res";
		}

		//Remove certain buffs
		this.combatBuffs = {"atk":0,"spd":0,"def":0,"res":0};

		//Don't do any buff crap if it's the second move of a turn (galeforce)
		if(!galeforce){
			//Check self buffs (defiant skills)
			roundText += this.defiant();

			//check turn for renewal
			//Does renewal happen before defiant?
			roundText += this.renew(turn);
			roundText += enemy.renew(turn);

			//Check threaten if not first turn (unless startThreatened is on)
			if((threatenRule=="Both"||threatenRule=="Attacker") && firstTurn){
				roundText += enemy.threaten(this);
			}
			if((threatenRule=="Both"||threatenRule=="Defender") || !firstTurn){
				roundText += this.threaten(enemy);
			}
		}

		//Check combat effects
		this.combatSpur = {"atk":0,"spd":0,"def":0,"res":0};
		enemy.combatSpur = {"atk":0,"spd":0,"def":0,"res":0};

		//This blows! (initiating boost skills)
		roundText += this.blow();
		//Initiatee defensive spurs (Naga, Binding Blade)
		roundText += enemy.defendBuff(relevantDefType);

		//Adjust speeds
		var thisEffSpd = this.spd + Math.max(this.buffs.spd,this.combatBuffs.spd) + Math.min(this.debuffs.spd,this.combatDebuffs.spd) + this.spur.spd + this.combatSpur.spd;
		var enemyEffSpd = enemy.spd + Math.max(enemy.buffs.spd,enemy.combatBuffs.spd) + Math.min(enemy.debuffs.spd,enemy.combatDebuffs.spd) + enemy.spur.spd + enemy.combatSpur.spd;

		if(this.panicked){
			thisEffSpd = this.spd - Math.max(this.buffs.spd,this.combatBuffs.spd) - Math.min(this.debuffs.spd,this.combatDebuffs.spd) + this.spur.spd + this.combatSpur.spd;
		}
		if(enemy.panicked){
			enemyEffSpd = enemy.spd - Math.max(enemy.buffs.spd,enemy.combatBuffs.spd) - Math.min(enemy.debuffs.spd,enemy.combatDebuffs.spd) + enemy.spur.spd + enemy.combatSpur.spd;
		}

		//check for any-distance counterattack
		var anyRangeCounter = false;
		if(enemy.has("Close Counter") || enemy.has("Distant Counter") || enemy.has("Raijinto") || enemy.has("Lightning Breath") || enemy.has("Ragnell") || enemy.has("Siegfried")){
			anyRangeCounter = true;
		}

		//check for vantage before beginning combat
		var vantage = false;
		if(enemy.has("Vantage")){
			if(enemy.hp/enemy.maxHp <= .25 * enemy.has("Vantage")){
				vantage = true;
			}
		}

		//check for desperation before beginning combat
		var desperation = false;
		if(this.has("Desperation")){
			if(this.hp/this.maxHp <= .25 * this.has("Desperation")){
				desperation = true;
			}
		}
		if(this.has("Sol Katti") && this.hp/this.maxHp <= .5){
			desperation = true;
		}

		//Check for quick riposte
		var quickRiposte = false;
		if(enemy.has("Quick Riposte")){
			if(enemy.hp/enemy.maxHp >= 1 - 0.1 * enemy.has("Quick Riposte")){
				quickRiposte = true;
			}
		}
		if(enemy.has("Armads") && enemy.hp/enemy.maxHp >= .8){
			quickRiposte = true;
		}

		//Check for brash assault
		var brashAssault = false;
		if(this.has("Brash Assault") && (this.range==enemy.range || anyRangeCounter)){
			if(this.hp/this.maxHp <= .2 + this.has("Brash Assault") * 0.1){
				brashAssault = true;
			}
		}

		//Check for wary fighter
		//Wary fighter can come from either unit
		//But some interactions apparently depend on who has it
		var waryFighter = false;
		var thisWaryFighter = false;
		var enemyWaryFighter = false;
		if(this.has("Wary Fighter")){
			if(this.hp/this.maxHp >= 1.1 - 0.2 * this.has("Wary Fighter")){
				waryFighter = true;
				thisWaryFighter = true;
			}
		}
		if(enemy.has("Wary Fighter")){
			if(enemy.hp/enemy.maxHp >= 1.1 - 0.2 * enemy.has("Wary Fighter")){
				waryFighter = true;
				enemyWaryFighter = true;
			}
		}

		//check for brave
		//brave will be passed to this.doDamage
		var brave = false;
		if(this.has("Brave Sword") || this.has("Brave Lance") || this.has("Brave Axe") || this.has("Brave Bow") || this.has("Dire Thunder")){
			brave = true;
		}

		//check for breaker skills
		//Need to rdo this code to avoid repeating twice...
		var thisBroken = false;
		var thisBreakLevel = 2; // hp threshold
		if(this.weaponType=="sword" && enemy.has("Swordbreaker")){
			thisBreakLevel = 1.1 - enemy.has("Swordbreaker") * 0.2;
		}
		else if(this.weaponType=="lance" && enemy.has("Lancebreaker")){
			thisBreakLevel = 1.1 - enemy.has("Lancebreaker") * 0.2;
		}
		else if(this.weaponType=="axe" && enemy.has("Axebreaker")){
			thisBreakLevel = 1.1 - enemy.has("Axebreaker") * 0.2;
		}
		else if(this.weaponType=="redtome" && enemy.has("R Tomebreaker")){
			thisBreakLevel = 1.1 - enemy.has("R Tomebreaker") * 0.2;
		}
		else if(this.weaponType=="bluetome" && enemy.has("B Tomebreaker")){
			thisBreakLevel = 1.1 - enemy.has("B Tomebreaker") * 0.2;
		}
		else if(this.weaponType=="greentome" && enemy.has("G Tomebreaker")){
			thisBreakLevel = 1.1 - enemy.has("G Tomebreaker") * 0.2;
		}
		else if(this.weaponType=="bow" && enemy.has("Bowbreaker")){
			thisBreakLevel = 1.1 - enemy.has("Bowbreaker") * 0.2;
		}
		else if(this.weaponType=="dagger" && enemy.has("Daggerbreaker")){
			thisBreakLevel = 1.1 - enemy.has("Daggerbreaker") * 0.2;
		}
		else if(this.weaponType=="dagger" && enemy.has("Assassin's Bow")){
			thisBreakLevel = 0;
		}

		var enemyBroken = false;
		var enemyBreakLevel = 2; // hp threshold
		if(enemy.weaponType=="sword" && this.has("Swordbreaker")){
			enemyBreakLevel = 1.1 - this.has("Swordbreaker") * 0.2;
		}
		else if(enemy.weaponType=="lance" && this.has("Lancebreaker")){
			enemyBreakLevel = 1.1 - this.has("Lancebreaker") * 0.2;
		}
		else if(enemy.weaponType=="axe" && this.has("Axebreaker")){
			enemyBreakLevel = 1.1 - this.has("Axebreaker") * 0.2;
		}
		else if(enemy.weaponType=="redtome" && this.has("R Tomebreaker")){
			enemyBreakLevel = 1.1 - this.has("R Tomebreaker") * 0.2;
		}
		else if(enemy.weaponType=="bluetome" && this.has("B Tomebreaker")){
			enemyBreakLevel = 1.1 - this.has("B Tomebreaker") * 0.2;
		}
		else if(enemy.weaponType=="greentome" && this.has("G Tomebreaker")){
			enemyBreakLevel = 1.1 - this.has("G Tomebreaker") * 0.2;
		}
		else if(enemy.weaponType=="bow" && this.has("Bowbreaker")){
			enemyBreakLevel = 1.1 - this.has("Bowbreaker") * 0.2;
		}
		else if(enemy.weaponType=="dagger" && this.has("Daggerbreaker")){
			enemyBreakLevel = 1.1 - this.has("Daggerbreaker") * 0.2;
		}
		else if(enemy.weaponType=="dagger" && this.has("Assassin's Bow")){
			enemyBreakLevel = 0;
		}

		if(enemy.hp / this.maxHp >= thisBreakLevel){
			thisBroken = true;
		}
		if(this.hp / this.maxHp >= enemyBreakLevel){
			enemyBroken = true;
		}

		if(thisBroken && enemyBroken){
			roundText += "Both units have breaker skills, so they cancel out.";
			thisBroken = false;
			enemyBroken = false;
		}
		else if(thisBroken){
			roundText += this.name + " is prevented from making a follow-up attack with " + enemy.name + "'s breaker skill.<br>";
		}
		else if(enemyBroken){
			roundText += enemy.name + " is prevented from making a follow-up attack with " + this.name + "'s breaker skill.<br>";
		}

		//Check for firesweep
		var firesweep = false;
		if(this.has("Firesweep Bow")){
			firesweep = true;
		}
		if(enemy.has("Firesweep Bow")){
			firesweep = true;
		}

		//check for windsweep
		//This skill is a fucking mess
		var windsweep = 0;
		if(this.has("Windsweep")){
			windsweep = this.has("Windsweep")*-2 + 7;
		}

		var watersweep = 0;
		if(this.has("Watersweep")){
			watersweep = this.has("Watersweep")*-2 + 7;
		}

		//Do AOE damage
		roundText += this.doDamage(enemy,false,true);

		var thisFollowUp = false;
		var enemyCanCounter = false;
		var enemyFollowUp = false;

		//I split up the follow-up rules to be less confusing, so there are extra computations
		if(thisEffSpd-enemyEffSpd >= 5){
			thisFollowUp = true;
		}
		if(thisEffSpd-enemyEffSpd <= -5){
			enemyFollowUp = true;
		}

		if(waryFighter){
			thisFollowUp = false;
			enemyFollowUp = false;
		}
		if(thisBroken){
			thisFollowUp = false;
			if(!waryFighter || thisEffSpd-enemyEffSpd <= -5){
				enemyFollowUp = true;
			}
		}
		if(enemyBroken){
			if(!waryFighter || thisEffSpd-enemyEffSpd >= 5){
				thisFollowUp = true;
			}
			enemyFollowUp = false;
		}
		if(brashAssault){
			if(!waryFighter || thisEffSpd-enemyEffSpd >= 5){
				thisFollowUp = true;
			}
		}
		if(quickRiposte){
			if(!waryFighter || thisEffSpd-enemyEffSpd <= -5){
				enemyFollowUp = true;
			}
		}
		//A unit with Wary Fighter can never double, even in a situation where the opponent can
		if(thisWaryFighter){	
			thisFollowUp = false;
		}
		if(enemyWaryFighter){
			enemyFollowUp = false;
		}
		if(windsweep || watersweep){
			thisFollowUp = false;
		}

		if(!firesweep && !(windsweep && data.physicalWeapons.indexOf(enemy.weaponType) != -1 && thisEffSpd-enemyEffSpd >= windsweep) && !(watersweep && data.magicalWeapons.indexOf(enemy.weaponType) != -1 && thisEffSpd-enemyEffSpd >= watersweep)){
			if(this.range==enemy.range || anyRangeCounter){
				enemyCanCounter = true;
			}
		}

		//Do vantage damage
		//Enemy attacks
		if(vantage && enemyCanCounter){
			roundText += enemy.name + " counterattacks first with vantage.<br>";
			roundText += enemy.doDamage(this);
		}

		//This attacks
		if(this.hp>0){
			roundText += this.doDamage(enemy,brave);
		}

		//Do desperation
		//This attacks
		if(this.hp > 0 && enemy.hp > 0 && desperation && thisFollowUp){
			roundText += this.name + " attacks again immediately with desperation.<br>";
			roundText += this.doDamage(enemy,brave);
		}

		//Enemy attacks, either vantage follow-up or first attack
		if(enemy.hp > 0 && this.hp > 0 && (!vantage || (vantage && enemyFollowUp && enemyCanCounter))){
			if(enemyCanCounter){
				roundText += enemy.doDamage(this);
			}
		}

		//Don't do this attack if already did desperation
		//or if broken
		//This attacks again
		if(this.hp>0 && enemy.hp > 0 && !desperation && thisFollowUp){
			roundText += this.doDamage(enemy,brave);
		}

		//Enemy attacks, non-vantage follow-up
		if(this.hp>0 && enemy.hp > 0 && !vantage && enemyCanCounter && enemyFollowUp){
			roundText += enemy.doDamage(this);
		}

		//Do post-combat damage to enemy if enemy isn't dead	
		if(enemy.hp>0){
			roundText += this.poisonEnemy(enemy);
			roundText += this.painEnemy(enemy);
			roundText += enemy.fury();
		}

		//Do post-combat damage to this if this isn't dead
		//No poison because this initiated
		if(this.hp>0){
			roundText += enemy.painEnemy(this);
			roundText += this.fury();
		}

		//Remove debuffs - if action done
		if(enemy.didAttack){
			enemy.combatDebuffs = {"atk":0,"spd":0,"def":0,"res":0};
			enemy.panicked = false;
		}
		if(this.didAttack){
			this.combatDebuffs = {"atk":0,"spd":0,"def":0,"res":0};
			this.panicked = false;
		}

		//Do stuff if both aren't dead
		if(this.hp > 0 && enemy.hp > 0){
			//Apply post-combat debuffs (seal)
			roundText += this.seal(enemy);
			roundText += enemy.seal(this);

			//post-combat buffs
			//Rogue dagger works on enemy turn, but buffs are reset at beginning of player turn, so it only matters if a rogue gets attacked twice in one turn, which is possible with Galeforce
			roundText += this.postCombatBuff();
			roundText += enemy.postCombatBuff();
			roundText += this.postCombatHeal();

			//panic
			if(this.has("Panic")){
				enemy.panicked = true;
				roundText += this.name + " panics " + enemy.name + ".<br>";
			}
			if(enemy.has("Panic")){
				this.panicked = true;
				roundText += enemy.name + " panics " + this.name + ".<br>";
			}

			//Finally, Galeforce!
			if(this.has("Galeforce") && data.skills[this.specialIndex].charge<=this.charge && useGaleforce){
				roundText += this.name + " initiates again with Galeforce!<br>";
				this.resetCharge();
				roundText += this.attack(enemy,turn,true);
			}
		}

		return roundText;
	}
}