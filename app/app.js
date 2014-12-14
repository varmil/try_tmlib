/*
 * Use tmlib.js 0.3.0
 */

(function() {

 //  Integrate with Underscore.js without module loading
_.mixin(_.str.exports());

//ディスプレイ定数
var SCREEN_WIDTH    = 648; // スクリーン幅
var SCREEN_HEIGHT   = 1152; // スクリーン高さ
var SCREEN_CENTER_X = SCREEN_WIDTH/2;   // スクリーン幅の半分
var SCREEN_CENTER_Y = SCREEN_HEIGHT/2;  // スクリーン高さの半分

// User定義パラメータ
var CONTROLLER_Y_POINT    = SCREEN_HEIGHT-250;  // コントロールバーのY座標
var PLAYER_Y_POINT        = SCREEN_HEIGHT-350;  // プレイヤーアイコンのY座標
var TIMER_Y_POINT         = 70;  // タイマーのY座標
var LEVEL_Y_POINT         = CONTROLLER_Y_POINT+100;  // レベルポップ時のY座標
var PLAYER_ICON_SIZE  = 100;
var SPATTER_DURATION  = 100; // ms

var LEVEL_FADEOUT_DURATION       = 3000; // ms
var PLAYER_DIE_ANIM_DURATION     = 1500; // ms

// 敵の動きのスピード制御
var NEXT_PATTERN_INTERVAL   = 800; // ms
var NORMAL_PATTERN_INTERVAL = 600; // ms
var NARROW_PATTERN_INTERVAL = 300; // ms
var RUSH_PATTERN_INTERVAL   = 350; // ms
var NORMAL_PATTERN_ENEMY_COUNT   = 4;
var NARROW_PATTERN_ENEMY_COUNT   = 4;
var RUSH_PATTERN_ENEMY_COUNT     = 3;

var ENEMY_HEAP_UP_DURATION  = 1500;  // ms
var ENEMY_MOVE_DURATION     = 3000; // ms

var PATTERN_NORMAL = 0;
var PATTERN_NARROW = 1;
var PATTERN_RUSH   = 2;
var POP_POS_LEFT   = 0;
var POP_POS_CENTER = 1;
var POP_POS_RIGHT  = 2;

var ENEMY_COLOR = [
	"hsl(120, 80%, 70%)",
	"hsl(240, 80%, 70%)",
	"hsl(360, 80%, 70%)"
];
var GIGANTIC = 4;

var FONT_LOBSTER     = "'Lobster' 'cursive'";

// アセット
var ASSETS = {
	bgTitle : "./assets/img/bgTitle.jpg",
	bgGame  : "./assets/img/bgGame.jpg"
};

var SOUNDS = {
	bgmTitle : "./assets/sound/221.mp3",
	bgmGame  : "./assets/sound/091.mp3",
	seAttack : "./assets/sound/se_048.mp3"
};

/*
 * main
 */
tm.main(function() {
	var app = tm.display.CanvasApp("#world");
	app.resize(SCREEN_WIDTH, SCREEN_HEIGHT);
	app.fitWindow();
	app.background = "rgba(200, 200, 200, 1.0)";// 背景色
	app.fps = 60;

	// ローディング
	var loadingScene = tm.app.LoadingScene({
		width: SCREEN_WIDTH,	// 幅
		height: SCREEN_HEIGHT,	// 高さ
		assets: ASSETS,			// アセット(必須)
		nextScene: LoadingSoundsScene	// ローディング完了後のシーン
	});
	app.replaceScene(loadingScene);

	// 実行
	app.run();
});

/*
 * SoundファイルのLoading
 */
tm.define("LoadingSoundsScene", {
	superClass: "tm.app.LoadingScene",
	isLoaded: false,

	init: function() {
	var param = {
		width: SCREEN_WIDTH,	// 幅
		height: SCREEN_HEIGHT	// 高さ
	};
		this.superInit(param);
		var _this = this;

		// Soundファイルのロード
		var SoundDeferred = new $.Deferred();
		this.loadSounds().done(function(){
			// Volume を抑える。
			_.each(SOUNDS, function(v, k){
				boombox.get(k).volume(0.1);
			});
			SoundDeferred.resolve();
		});

		// ロード完了したらフラグを立てる。
		$.when(SoundDeferred).done(function(){
			console.log("done");
			_this.isLoaded = true;
		});
	},

	update: function(app) {
		if (this.isLoaded) {
			app.replaceScene(TitleScene());
		}
	},

	loadSounds: function() {
		boombox.setup();


		var parentDeferred = new $.Deferred().resolve();

		_.each(SOUNDS, function(v, k){
			parentDeferred = parentDeferred.then(function(){
				var childDeferred = new $.Deferred();
				var options = {
					src: [{
						media: 'audio/mp4',
						path: v
					}]
				};
				boombox.load(k, options, function (err, htmlaudio) {
					// resolve Deferred
					console.log("loaded");
					childDeferred.resolve();
				});

				return childDeferred;
			});
		});

		return parentDeferred;
	}
});

/*
 * title scene
 */
tm.define("TitleScene", {
	superClass: "tm.app.Scene",

	init: function() {
		this.superInit();

		// 背景適用
		tm.display.Sprite("bgTitle", SCREEN_WIDTH, SCREEN_HEIGHT).setOrigin(0,0).addChildTo(this);

		// BGM 再生
		boombox.get('bgmTitle').setLoop(boombox.LOOP_NATIVE);
		boombox.get('bgmTitle').play();

		this.fromJSON({
			children: [
				{
					type: "Label", name: "titleLabel",
					text: "Wave  Fever",
					x: SCREEN_CENTER_X, y: 200,
					fillStyle: "#f5f5f5",
					fontSize: 100, fontFamily: FONT_LOBSTER,
					align: "center", baseline: "middle"
				},
				{
					type: "Label", name: "nextLabel",
					text: "TOUCH START",
					x: SCREEN_CENTER_X, y: SCREEN_CENTER_Y,
					fillStyle: "#f5f5f5", fontSize: 35,
					fontFamily: FONT_LOBSTER,
					align: "center", baseline: "middle"
				}
			]
		});

		this.nextLabel.tweener
			.fadeOut(500)
			.fadeIn(1000)
			.setLoop(true);

		Player().addChildTo(this);
	},

	update: function(app) {
		if (app.pointing.getPointing()) {
			boombox.get('bgmTitle').stop();
			this.app.replaceScene(GameScene());
		}
	}
});

/*
 * main scene
 */
tm.define("GameScene", {
	superClass: "tm.app.Scene",
	level: 0, // ゲームレベル(初回０。徐々に上がる)

	init: function() {
		var self = this;
		this.superInit();

		this.stats = new Stats();
		document.body.appendChild(this.stats.domElement);

		// 背景適用
		tm.display.Sprite("bgGame", SCREEN_WIDTH, SCREEN_HEIGHT).setOrigin(0,0).addChildTo(this);

		boombox.get('bgmGame').setLoop(boombox.LOOP_NATIVE);
		boombox.get('bgmGame').play();

		// Player描画(Enemyとの衝突判定で使うのでグローバルに持つ、バッドだな...)
		// 実質Singletonみたいなもの。
		window.player = Player().addChildTo(this);
		player.playerIcon.on('collision', function() {
			player.playerIcon.off('collision');
			// 間違った色に接触した瞬間にタイマーをストップする
			self.timer.sleep();
		});
		player.playerIcon.on('dieAnimationEnd', function(e) {
			player.playerIcon.off('dieAnimationEnd');
			document.body.removeChild(self.stats.domElement);
			self.app.replaceScene(GameOverScene(self.level, self.timer.label.text));
		});

		this.timer = Timer().addChildTo(this);
		this.levelLabel = levelLabel().addChildTo(this);
		this.pattern = Pattern().addChildTo(this).on('popEnd', function(e) {
			// 一連のパターンが終了したら、インターバルを置いた後、次のパターンへ。
			setTimeout(_.bind(self.createPattern, self), NEXT_PATTERN_INTERVAL);
		});

		// 初回パターン生成
		this.createPattern();
	},

	update: function(app) {
		this.stats.update();
		// 一定時間毎にレベルアップ
		if (this.timer.label.text > this.level * 15 + 15) {
			console.log("LevelUpTo:", this.level);
			this.level = this.level + 1;
			this.levelLabel.levelUp(this.level);
		}
	},

	createPattern: function() {
		var patternNum  = tm.util.Random.randint(0, 2);
		var popPosition = tm.util.Random.randint(POP_POS_LEFT, POP_POS_RIGHT);

		switch(patternNum){
			case PATTERN_NORMAL:
				this.pattern.createNormal(this.level, popPosition);
				break;
			case PATTERN_NARROW:
				this.pattern.createNarrow(this.level, popPosition);
				break;
			case PATTERN_RUSH:
				this.pattern.createRush(this.level, popPosition);
				break;
		}
	}
});

/*
 * Pattern生成クラス（複数のエネミーと、アニメーション情報を持つ）
 * @param patternNum 0:ノーマル, 1:短感覚 , 2:ため高速
 * @param popPosition 0:左, 1:中央, 2:右
 */
tm.define("Pattern", {
	superClass: "tm.app.Object2D",

	init: function() {
		this.superInit();
	},

	createNormal: function(level, popPosition){
		var i = level + NORMAL_PATTERN_ENEMY_COUNT;
		var _this = this;
		var color = this.createEnemyColorList(i); // ["hsl(...)", "hsl(...)", ...]

		// 時間差をつけて生成
		function popEnemy(){
			if (i === 0) {
				_this.flare('popEnd');
				return;
			}
			i--;
			Enemy(PATTERN_NORMAL, popPosition, color.shift()).addChildTo(_this);
			setTimeout(function(){popEnemy(level)}, NORMAL_PATTERN_INTERVAL);
		}
		popEnemy();
	},

	createNarrow: function(level, popPosition){
		var i = level + NARROW_PATTERN_ENEMY_COUNT;
		var _this = this;
		var color = this.createEnemyColorList(i);

		// 時間差をつけて生成
		function popEnemy(){
			if (i === 0) {
				_this.flare('popEnd');
				return;
			}
			i--;
			Enemy(PATTERN_NARROW, popPosition, color.shift()).addChildTo(_this);
			setTimeout(function(){popEnemy(level)}, NARROW_PATTERN_INTERVAL);
		}
		popEnemy();
	},

	createRush: function(level, popPosition){
		var i = level + RUSH_PATTERN_ENEMY_COUNT;
		var _this = this;
		var color = this.createEnemyColorList(i);

		// 時間差をつけて生成
		function popEnemy(){
			if (i === 0) {
				_this.flare('popEnd');
				return;
			}
			i--;
			// RUSHの場合ランダムでpop位置を取得
			var popPosition = _.sample([POP_POS_LEFT, POP_POS_CENTER, POP_POS_RIGHT]);
			Enemy(PATTERN_RUSH, popPosition, color.shift()).addChildTo(_this);
			setTimeout(function(){popEnemy(level)}, RUSH_PATTERN_INTERVAL);
		}
		popEnemy();
	},

	createEnemyColorList: function(length) {
		var result = [], i = 0, k = 0;
		// まず、何体ずつ同色にするか
		var max = Math.ceil(4/length + length/8);
		var sameColorLength = tm.util.Random.randint(1, max);

		for (i=0; i<length; i++){
			// 前回とは異なる色を作成
			var color =
			_.chain(ENEMY_COLOR)
			 .filter(function(c){return c !== color;})
			 .sample()
			 .value();
			// 上で設定した数の倍数を超えるごとに、色をスイッチする。
			for (k=0; k<sameColorLength; k++) {
				if (result.length > length) return result;
				result.push(color);
			}
		}

		return result;
	}
});
/*
 * Enemy
 * @param int patternNum
 * @param int left or right (出現位置)
 */
tm.define("Enemy", {
	superClass: "tm.app.Shape",
	color: null, // 自身の色情報を格納
	radius: 250,

	init: function(patternNum, popPosition, color) {
		this.superInit(this.radius*2, this.radius*2);

		// 開始時座標
		this.x = this.getPopPosition(popPosition);
		this.y = -this.radius;

		// キャッシュしておく
		this.color = color;
		var param = {
			fillStyle: "transparent",
			strokeStyle: color,
			lineWidth: "15",
		};
		// 円描画
		this.renderCircle(param);
		this.setInteractive(true);
		this.blendMode  = "lighter";

		this.moveEnemy(patternNum);
	},

	update: function(app) {
		// 円と１点との衝突判定
		if (this.isHitPointCircle(SCREEN_CENTER_X, PLAYER_Y_POINT-PLAYER_ICON_SIZE/2)){

			// 死亡アニメーション中ならば何もしない
			if (window.player.isDead) return;

			if (this.color === window.player.playerIcon.color) {
				// パーティクル生成
				window.player.spatter(this.color);
				boombox.get('seAttack').play();
			} else {
				// 間違った色に触れた場合は死亡
				window.player.die();
			}

			// 一度、衝突したら自殺
			this.remove();
			delete this.color;
		}
	},

	moveEnemy: function(patternNum) {
		// 敵の移動
		this.tweener
			.clear()
			.to({y: -this.radius/1.5}, ENEMY_HEAP_UP_DURATION)
			.to({
				radius: this.radius * GIGANTIC,
				scaleX: GIGANTIC,
				scaleY: GIGANTIC,
				x: SCREEN_CENTER_X,
				y: SCREEN_CENTER_Y
			}, this.getMoveDuration(patternNum))
		;
	},

	getPopPosition: function(popPosition) {
		switch (popPosition){
			case POP_POS_LEFT:
				return 0 - this.radius/2.5;
			case POP_POS_CENTER:
				return SCREEN_CENTER_X;
			case POP_POS_RIGHT:
				return SCREEN_WIDTH + this.radius/2.5;
		}
	},

	getMoveDuration: function(patternNum) {
		switch (patternNum){
			case PATTERN_NORMAL:
				return ENEMY_MOVE_DURATION;
			case PATTERN_NARROW:
				return ENEMY_MOVE_DURATION;
			case PATTERN_RUSH:
				return ENEMY_MOVE_DURATION / 1.5;
		}
	}
});

/*
 * Timer (カウントアップしていくやつ)
 */
tm.define("Timer", {
	superClass: "tm.app.Object2D",

	init: function() {
		this.superInit();

		// 後から生成したモノがレイヤー上位ぽい
		TimerBG().addChildTo(this);
		this.label = TimerLabel().addChildTo(this);
	}
});
/*
 * Timerの数値部分
 */
tm.define("TimerLabel", {
	superClass: "tm.display.Label",
	time_counter: 0,

	init: function() {
		this.superInit("0", /*fontSize =*/ 45);

		// タイマーラベル
		this
			.setPosition(SCREEN_CENTER_X, TIMER_Y_POINT)
			.setFillStyle("#fff")
			.setAlign("center")
			.setBaseline("middle")
			.setFontFamily(FONT_LOBSTER)
		;
	},

	update: function(app) {
		// タイマー更新
		var time  = (this.time_counter/app.fps);
		this.text = _.numberFormat(time, 2);
		this.time_counter++;
	}
});
/*
 * Timerの背景部分
 */
tm.define("TimerBG", {
	superClass: "tm.display.RectangleShape",

	init: function() {
		// タイマーの背景
		var angle = tm.util.Random.randint(0, 360);
		var param = {
			fillStyle: "rgba(0, 0, 0, 0.5)".format(angle),
			strokeStyle: "transparent",
			lineWidth: "0",
		};

		this.superInit(SCREEN_WIDTH, 90, param);
		this.originX = 0;
		this.y = TIMER_Y_POINT;
	}
});

/*
 * Player (コントロールエリア＋ビートするやつ)
 * windowの下にぶら下げる。最終スコアもここに格納する。
 */
tm.define("Player", {
	superClass: "tm.app.Object2D",
	isDead: false,

	init: function() {
		this.superInit();

		this.controller = Controller().addChildTo(this);
		this.playerIcon = PlayerIcon().addChildTo(this);

		// パーティクル生成しておく
		this.particleList = ParticleList().addChildTo(this);
	},

	spatter: function(color) {
		this.particleList.show(color);
	},

	die: function() {
		this.isDead = true;
		this.playerIcon.die();
	},

	update: function() {
		this.playerIcon.color = this.controller.color;
	}
});
/*
 * particleの固まりを格納する
 */
tm.define("ParticleList", {
	superClass: "tm.app.Object2D",

	init: function() {
		this.superInit();

		var i=0, length=100;
		for(i=0; i<length; i++){
			Particle().addChildTo(this);
		}
	},

	show: function(color) {
		_.each(this.children, function(c){
			c.show(color);
		});
	}
});
/*
 * Enemyを消した時に出るParticle
 */
tm.define("Particle", {
	superClass: "tm.display.CircleShape",

	init: function() {
		var radius = tm.util.Random.randint(5, 20);
		var param = {
			fillStyle: "hsl(50, 80% ,70%)"
		};
		this.superInit(radius, radius, param);

		this.x = SCREEN_CENTER_X;
		this.y = PLAYER_Y_POINT;
		var rand_y_min = PLAYER_Y_POINT-SCREEN_CENTER_Y;
		var rand_y_max = PLAYER_Y_POINT+SCREEN_CENTER_Y;
		this.vx = tm.util.Random.randint(0, SCREEN_WIDTH);
		this.vy = tm.util.Random.randint(rand_y_min, rand_y_max);
		this.tweener.fadeOut(1);
	},

	// TODO 引数のcolorを使う。
	show: function(color) {
		this.tweener.clear()
			.fadeIn(1)
			.to({x:this.vx, y:this.vy}, SPATTER_DURATION)
			.fadeOut(SPATTER_DURATION)
			.to({x:SCREEN_CENTER_X, y:PLAYER_Y_POINT}, 1) // 元の位置へ
		;
	}
});

/*
 * PlayerIcon (ビートするやつ)
 */
tm.define("PlayerIcon", {
	superClass: "tm.display.TriangleShape",
	color: null, // Pointerのcolorに対応
	current_color: null, // キャッシュ情報

	init: function() {
		this.superInit(PLAYER_ICON_SIZE, PLAYER_ICON_SIZE);
		this.x = SCREEN_CENTER_X;
		this.y = PLAYER_Y_POINT;

		// リズムを刻む
		this.beat();

		// 目
		var param = {
			fillStyle: "#333", strokeStyle: "#f5f5f5", lineWidth: "6"
		};
		tm.display.CircleShape(30, 15, param).addChildTo(this);
	},

	update: function(app) {
		// 現在のcolorと新しいcolorが違ったら色を変化
		if (this.color !== this.current_color || this.current_color === null) {
			this.current_color = this.color;
			var param = {
				fillStyle:  this.color
			};
			this.renderTriangle(param);
		}
	},

	beat: function(){
		this.tweener
			.to({scaleX:1.15, scaleY:1.15}, 500)
			.to({scaleX:1, scaleY:1}, 100)
			.setLoop(true)
		;
	},

	// 死亡処理（ゲームオーバーへ）
	die: function() {
		var self = this;
		this.tweener.pause();
		boombox.get('bgmGame').stop();

		this.flare('collision');

		// 死んだ際のアニメーション
		var tween = tm.anim.Tween();
		tween.onfinish = function() {
			self.flare('dieAnimationEnd');
		}
		tween
			.to(this, {x:SCREEN_WIDTH+200, y:SCREEN_HEIGHT}, PLAYER_DIE_ANIM_DURATION)
			.setTransition("easeInOutBack")
			.start();

		// 回転させながら。
		this.tweener
			.clear()
			.to({rotation: this.rotation + 1000}, PLAYER_DIE_ANIM_DURATION);
	}
});

/*
 * Controller (入力部分)
 */
tm.define("Controller", {
	superClass: "tm.app.Object2D",
	color: null, // Pointerが乗っているcolorを格納

	init: function() {
		this.superInit();

		ControllerBG().addChildTo(this);
		this.pointer = ControllerPointer().addChildTo(this);
	},

	update: function() {
		this.color = this.pointer.color;
	}
});
/*
 * プレイヤーが操作可能なポインター
 */
tm.define("ControllerPointer", {
	superClass: "tm.display.CircleShape",
	color: null, // string

	init: function() {
		var width = 60, height = 60;
		var param = {
			fillStyle: "#333",
			strokeStyle: "#f5f5f5",
			lineWidth: "20"
		};
		this.superInit(width, height, param);
		this.y = CONTROLLER_Y_POINT;
		this.blendMode  = "lighter"; // 中心色が変化するように
	},

	update: function(app) {
		this.x = app.pointing.x;

		// 現在乗っているピースの色を格納
		this.color = this.getLyingPieceColor();
	},

	// ピースが３つと想定
	getLyingPieceColor: function() {
		var left   = (this.x < SCREEN_WIDTH/3);
		var center = (this.x >= SCREEN_WIDTH/3 && this.x < SCREEN_WIDTH/3*2);
		var right  = (this.x > SCREEN_WIDTH/3*2);

		if (left)   return ENEMY_COLOR[0];
		if (center) return ENEMY_COLOR[1];
		if (right)  return ENEMY_COLOR[2];
	}
});
/*
 * プレイヤーが操作可能な部分の背景
 */
tm.define("ControllerBG", {
	superClass: "tm.app.Object2D",

	init: function() {
		this.superInit();

		ControllerBGPiece(ENEMY_COLOR[0], 0).addChildTo(this);
		ControllerBGPiece(ENEMY_COLOR[1], 1).addChildTo(this);
		ControllerBGPiece(ENEMY_COLOR[2], 2).addChildTo(this);
	}
});
/*
 * プレイヤーが操作可能な部分の背景の破片。とりあえず３つと決め打ち
 * @param color: 背景色
 * @param position: int 小さいほど左に位置する
 */
tm.define("ControllerBGPiece", {
	superClass: "tm.display.RectangleShape",

	init: function(color, position) {
		var param = {
			fillStyle: color,
			strokeStyle: "transparent",
			lineWidth: "0"
		};
		this.superInit(SCREEN_WIDTH/3, 30, param);
		this.originX = 0;
		this.x = SCREEN_WIDTH/3 * position;
		this.y = CONTROLLER_Y_POINT;
	}
});

/*
 * levelUp時のラベル
 */
tm.define("levelLabel", {
	superClass: "tm.display.Label",

	init: function() {
		this.superInit("Level: 0", /*fontSize =*/ 45);

		this
			.setPosition(SCREEN_WIDTH - 50, LEVEL_Y_POINT)
			.setFillStyle("#f3f3f3")
			.setAlign("right")
			.setBaseline("middle")
			.setFontFamily(FONT_LOBSTER)
		;
		this.tweener.fadeOut(LEVEL_FADEOUT_DURATION);
	},

	levelUp: function(level) {
		this.text = "Level Up!!   Level: "+level;
		this.tweener
			.clear()
			.fadeIn(100)
			.fadeOut(LEVEL_FADEOUT_DURATION);
	}
});


/*
 * GameOver scene
 */
tm.define("GameOverScene", {
	superClass: "tm.app.Scene",

	init: function(level, time) {
		this.superInit();

		// 背景適用
		tm.display.Sprite("bgTitle", SCREEN_WIDTH, SCREEN_HEIGHT).setOrigin(0,0).addChildTo(this);

		this.fromJSON({
			children: [
				{
					type: "Label", name: "levelLabel",
					text: "LEVEL: "+level,
					x: 100, y: 200,
					fillStyle: "hsl(200, 80%, 70%)",
					fontSize: 95, fontFamily: FONT_LOBSTER,
					align: "left", baseline: "middle"
				},
				{
					type: "Label", name: "timeLabel",
					text: "TIME:  "+time,
					x: 100, y: 350,
					fillStyle: "hsl(200, 80%, 70%)",
					fontSize: 95, fontFamily: FONT_LOBSTER,
					align: "left", baseline: "middle"
				},
				{
					type: "Label", name: "nextLabel",
					text: "TOUCH RETRY",
					x: SCREEN_CENTER_X, y: SCREEN_CENTER_Y,
					fillStyle: "#f5f5f5",
					fontSize: 35, fontFamily: FONT_LOBSTER,
					align: "center", baseline: "middle"
				}
			]
		});
		this.nextLabel.tweener
			.to({scaleX:1.05, scaleY:1.05}, 800)
			.to({scaleX:1, scaleY:1}, 400)
			.setLoop(true)
		;

		this.createTransparentButton();
		this.createTweetButton(level, time);
	},

	createTweetButton: function(level, time) {
		var param = {
			width: 300, height: 100,
			bgColor: "#00aced",
			text: "Tweet",
			fontSize: 60, fontFamily: FONT_LOBSTER
		};
		var tweetButton = tm.ui.FlatButton(param).addChildTo(this);
		tweetButton.x = SCREEN_CENTER_X;
		tweetButton.y = SCREEN_HEIGHT - 200;

		// ツイート
		tweetButton.addEventListener("pointingstart", function(e) {
			window.open(tm.social.Twitter.createURL({
				type    : "tweet",
				text    : "5秒で遊べるリズムゲーム『Wave Fever』\nLevel：【"+level+"】、Time：【"+time+"】でした。",
				hashtags: "tmlib",
				url     : "https://github.com/varmil/try_tmlib"
			}), "_self");
		});
	},

	// FlatButtonだとテキストが入ってしまうので。
	createTransparentButton: function() {
		var _this = this;

		var param = {
			fillStyle   : "rgba(0, 0, 0, 0)",
			strokeStyle : "rgba(0, 0, 0, 0)",
			lineWidth   : 0
		};
		var dummyButton = tm.display.RectangleShape(SCREEN_WIDTH,SCREEN_HEIGHT,param).addChildTo(this);
		dummyButton.x = SCREEN_CENTER_X;
		dummyButton.y = 250;
		dummyButton.setInteractive(true);

		dummyButton.addEventListener("pointingstart", function(e) {
			_this.app.replaceScene(GameScene());
		});
	}
});

})();
