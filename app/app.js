// forked from phi's "template - tmlib.js 0.2.2" http://jsdo.it/phi/yRg0
// forked from phi's "template - tmlib.js 0.1.7" http://jsdo.it/phi/m68l
/*
 * tmlib.js 0.2.0
 */

 //  Integrate with Underscore.js without module loading
_.mixin(_.str.exports()); 

//ディスプレイ定数
const SCREEN_WIDTH    = 648;			  // スクリーン幅
const SCREEN_HEIGHT   = 1152;			  // スクリーン高さ
const SCREEN_CENTER_X = SCREEN_WIDTH/2;   // スクリーン幅の半分
const SCREEN_CENTER_Y = SCREEN_HEIGHT/2;  // スクリーン高さの半分

// User定義パラメータ
const CONTROLLER_Y_POINT    = SCREEN_HEIGHT-250;  // コントロールバーのY座標
const PLAYER_Y_POINT        = SCREEN_HEIGHT-350;  // プレイヤーアイコンのY座標
const TIMER_Y_POINT         = 70;  // タイマーのY座標

// 敵の動きのスピード制御
const NEXT_PATTERN_INTERVAL   = 800; // ms
const NORMAL_PATTERN_INTERVAL = 800; // ms
const NARROW_PATTERN_INTERVAL = 400; // ms
const RUSH_PATTERN_INTERVAL   = 350; // ms
const NORMAL_PATTERN_ENEMY_COUNT   = 4;
const NARROW_PATTERN_ENEMY_COUNT   = 4;
const RUSH_PATTERN_ENEMY_COUNT     = 3;

const ENEMY_HEAP_UP_DURATION  = 1000;  // ms
const ENEMY_MOVE_DURATION     = 2500; // ms

const POP_POS_LEFT   = 0;
const POP_POS_CENTER = 1;
const POP_POS_RIGHT  = 2;

const ENEMY_COLOR = [
	"hsl(120, 80%, 70%)",
	"hsl(240, 80%, 70%)",
	"hsl(360, 80%, 70%)"
];
const GIGANTIC = 4;

const FONT_FAMILY_FLAT= "'Helvetica-Light' 'Meiryo' sans-serif";  // フラットデザイン用フォント

// アセット
const ASSETS = {
	"bgTitle": "./assets/img/bgTitle.jpg",
	"bgGame" : "./assets/img/bgGame.jpg"
};


/*
 * main
 */
tm.main(function() {
	var app = tm.display.CanvasApp("#world");
	app.resize(SCREEN_WIDTH, SCREEN_HEIGHT);
	app.fitWindow();
	app.background = "rgba(235, 235, 235, 1.0)";// 背景色
	app.fps = 70;

	// ローディング
	var loadingScene = tm.app.LoadingScene({
		width: SCREEN_WIDTH,	// 幅
		height: SCREEN_HEIGHT,	// 高さ
		assets: ASSETS,			// アセット(必須)
		nextScene: LoadingSoundsScene,	// ローディング完了後のシーン
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
		height: SCREEN_HEIGHT,	// 高さ
	};
		this.superInit(param);
		var _this = this;

		// Soundファイルのロード
		var SoundDeferred = new $.Deferred();
		this.loadSounds().done(function(){
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

		var sounds = {
			bgmTitle: "./assets/sound/221.mp3",
			bgmGame : "./assets/sound/091.mp3",
		}

		var parentDeferred = new $.Deferred().resolve();

		_.each(sounds, function(v, k){
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
	},
});

/*
 * title scene
 */
tm.define("TitleScene", {
	superClass: "tm.app.Scene",
	
	init: function() {
		this.superInit();

		// 背景適用
		tm.display.Sprite("bgTitle", SCREEN_WIDTH, SCREEN_HEIGHT)
			.setOrigin(0,0)
			.addChildTo(this);
		
		// BGM 再生
		boombox.get('bgmTitle').volume(0.1);
		boombox.get('bgmTitle').setLoop(boombox.LOOP_NATIVE);
		boombox.get('bgmTitle').play();

		this.fromJSON({
			children: [
				{
					type: "Label", name: "titleLabel",
					text: "Wave Weaver Parody",
					x: SCREEN_CENTER_X,
					y: 200,
					fillStyle: "#f5f5f5",
					fontSize: 50,
					fontFamily: FONT_FAMILY_FLAT,
					align: "center",
					baseline: "middle"
				},
				{
					type: "Label", name: "nextLabel",
					text: "TOUCH START",
					x: SCREEN_CENTER_X,
					y: 650,
					fillStyle: "#f5f5f5",
					fontSize: 26,
					fontFamily: FONT_FAMILY_FLAT,
					align: "center",
					baseline: "middle"
				}
			]
		});
		
		this.nextLabel.tweener
			.fadeOut(500)
			.fadeIn(1000)
			.setLoop(true);
				
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
	pattern: null, // Patternインスタンス
	level: 0, // ゲームレベル(初回０。徐々に上がる？ TODO )
	
	init: function() {
		this.superInit();

		// 背景適用
		tm.display.Sprite("bgGame", SCREEN_WIDTH, SCREEN_HEIGHT)
			.setOrigin(0,0)
			.addChildTo(this);

		// BGM再生
		boombox.get('bgmGame').volume(0.1);
		boombox.get('bgmGame').setLoop(boombox.LOOP_NATIVE);
		boombox.get('bgmGame').play();

		// Player描画(Enemyとの衝突判定で使うのでグローバルに持つ、バッドだな...)
		// 実質Singletonみたいなもの。
		window.player = Player().addChildTo(this);

		// Timer描画
		this.timer = Timer().addChildTo(this);
		
		// 初回パターン生成
		this.createPattern(this);
	},

	update: function(app) {
		// 一連のパターンが判定終了したら、インターバルを置いた後、次のパターンへ。
		if (this.pattern && this.pattern.ended_flag) {
			this.pattern = null;
			setTimeout(this.createPattern, NEXT_PATTERN_INTERVAL, this);
		}

		// 一定時間毎にレベルアップ
		if (this.timer.label.text > this.level * 15 + 15) {
			console.log("LevelUpTo:", this.level);
			this.level = this.level + 1;
		}
	},

	createPattern: function(obj) {
		obj.pattern = Pattern(obj.level).addChildTo(obj);
	}
});

/*
 * Pattern生成クラス（複数のエネミーと、アニメーション情報を持つ）
 * @param patternNum 0:ノーマル, 1:短感覚 , 2:ため高速
 * @param popPosition 0:左, 1:中央, 2:右
 */
tm.define("Pattern", {
	superClass: "tm.app.Object2D",
	ended_flag: false,
	patternNum: 0,
	popPosition: 0,

	init: function(level) {
		this.superInit();

		this.patternNum  = tm.util.Random.randint(0, 2);
		this.popPosition = tm.util.Random.randint(POP_POS_LEFT, POP_POS_RIGHT);
		
		switch(this.patternNum){
			case 0:
				this.createNormal(level);
				break;
			case 1:
				this.createNarrow(level);
				break;
			case 2:
				this.createRush(level);
				break;
		}
	},

	update: function(){
	
	},

	createNormal: function(level){
		var i = level + NORMAL_PATTERN_ENEMY_COUNT;
		var _this = this;
		var color = this.createEnemyColorList(i); // ["hsl(...)", "hsl(...)", ...]

		// 時間差をつけて生成
		function popEnemy(){
			if (i == 0) {
				_this.ended_flag = true; // 次のパターン生成を許可
				return;
			}
			i--;
			Enemy(_this.patternNum, _this.popPosition, color.shift()).addChildTo(_this);
			setTimeout(function(){popEnemy(level)}, NORMAL_PATTERN_INTERVAL);
		}
		popEnemy();
	},

	createNarrow: function(level){
		var i = level + NARROW_PATTERN_ENEMY_COUNT;
		var _this = this;
		var color = this.createEnemyColorList(i);

		// 時間差をつけて生成
		function popEnemy(){
			if (i == 0) {
				_this.ended_flag = true;
				return;
			}
			i--;
			Enemy(_this.patternNum, _this.popPosition, color.shift()).addChildTo(_this);
			setTimeout(function(){popEnemy(level)}, NARROW_PATTERN_INTERVAL);
		}
		popEnemy();
	},

	createRush: function(level){
		var i = level + RUSH_PATTERN_ENEMY_COUNT;
		var _this = this;
		var color = this.createEnemyColorList(i);

		// 時間差をつけて生成
		function popEnemy(){
			if (i == 0) {
				_this.ended_flag = true;
				return;
			}
			i--;
			// ランダムでpop位置を取得
			_this.popPosition = _.sample([POP_POS_LEFT, POP_POS_CENTER, POP_POS_RIGHT]);
			Enemy(_this.patternNum, _this.popPosition, color.shift()).addChildTo(_this);
			setTimeout(function(){popEnemy(level)}, RUSH_PATTERN_INTERVAL);
		}
		popEnemy();
	},

	createEnemyColorList: function(length) {
		var result = [], i = k = 0;
		// まず、何体ずつ同色にするか
		var max = Math.ceil(4/length + length/8);
		var sameColorLength = tm.util.Random.randint(1, max);
		
		for (i=0; i<length; i++){
			// 前回とは異なる色を作成
			var color = 
			_.chain(ENEMY_COLOR)
			 .filter(function(c){return c !== color})
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

		this.moveEnemy();
	},
	
	update: function(app) {
		// 円と１点との衝突判定
		if (this.isHitPointCircle(SCREEN_CENTER_X, PLAYER_Y_POINT)){
			// PassionLabel().addChildTo(this);
			this.remove();
			delete this;

			if (this.color === window.player.playerIcon.color) {
				// TODO パーティクル生成
			} else { 
				// TODO 間違った色に触れた場合は死亡
				console.log("dead");
			}
		}
	},
	
	moveEnemy: function() {
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
			}, ENEMY_MOVE_DURATION)
/* 			.call(function(){
				// 自分自身を破棄
				console.log("remove");
				this.remove();
			}.bind(this)) */
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
			.setFontFamily(FONT_FAMILY_FLAT)
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
 */
tm.define("Player", {
	superClass: "tm.app.Object2D",

	init: function() {
		this.superInit();

		this.controller = Controller().addChildTo(this);
		this.playerIcon = PlayerIcon().addChildTo(this);
	},

	update: function() {
		// TODO colorを格納
		this.playerIcon.color = this.controller.color;
	},
});
/*
 * PlayerIcon (ビートするやつ)
 */
tm.define("PlayerIcon", {
	superClass: "tm.display.TriangleShape",
	color: null, // Pointerのcolorに対応
	current_color: null, // キャッシュ情報

	init: function() {
		var width = 100, height = 100;
		this.superInit(width, height);
		this.x = SCREEN_CENTER_X;
		this.y = PLAYER_Y_POINT;

		// リズムを刻む
		this.beat();
	},
	
	update: function(app) {
		// 現在のcolorと新しいcolorが違ったら色を変化
		if (this.color !== this.current_color || this.current_color === null) {
			this.current_color = this.color;
			var param = {
				fillStyle:  this.color,
			};
			this.renderTriangle(param);
		}
	},
	
	beat: function(){
		this.tweener
			.to({scaleX:1.15, scaleY:1.15}, 400)
			.to({scaleX:1, scaleY:1}, 100)
			.setLoop(true)
		;
	},
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
		// colorを格納
		this.color = this.pointer.color;
	},
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
			lineWidth: "20",
		};
		this.superInit(width, height, param);
		this.y = CONTROLLER_Y_POINT;
		this.blendMode  = "lighter"; // 中心色が変化するように
	},

	update: function(app) {
		var p = app.pointing;
		this.x = p.x;

		if (p.getPointing()) {
			// 現在乗っているピースの色を格納
			this.color = this.getLyingPieceColor();
		}
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
			lineWidth: "0",
		};
		this.superInit(SCREEN_WIDTH/3, 25, param);
		this.originX = 0;
		this.x = SCREEN_WIDTH/3 * position;
		this.y = CONTROLLER_Y_POINT;
	}
});

/*
 * Excellent! Great! Good! Bad! とかのラベル表示
 */
tm.define("PassionLabel", {
	superClass: "tm.display.Label",
	time_counter: 0,
	display_sec: 1.0, // 表示時間

	init: function() {
	console.log("[PassionLabel]");
		this.superInit("Excellent!", /*fontSize =*/ 120);

		this
			.setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y)
			.setFillStyle("#fff")
			.setAlign("center")
			.setBaseline("middle")
			.setFontFamily(FONT_FAMILY_FLAT)
		;
	},

	update: function(app) {
		// var time  = (this.time_counter/app.fps);
		// if (time > this.display_sec){
			// TODO テキスト表示をフェードアウト
			// this.tweener
				// .fadeOut(300)
			// ;
		// }
		// this.time_counter++;
	}
});