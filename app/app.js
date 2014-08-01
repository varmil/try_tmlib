// forked from phi's "template - tmlib.js 0.2.2" http://jsdo.it/phi/yRg0
// forked from phi's "template - tmlib.js 0.1.7" http://jsdo.it/phi/m68l
/*
 * tmlib.js 0.2.0
 */

 //  Integrate with Underscore.js without module loading
_.mixin(_.str.exports()); 

/*
 * ディスプレイ定数
 */
const SCREEN_WIDTH    = 640;			  // スクリーン幅
const SCREEN_HEIGHT   = 960;			  // スクリーン高さ
const SCREEN_CENTER_X = SCREEN_WIDTH/2;   // スクリーン幅の半分
const SCREEN_CENTER_Y = SCREEN_HEIGHT/2;  // スクリーン高さの半分

// User定義パラメータ
const CONTROLLER_Y_POINT    = SCREEN_HEIGHT-100;  // コントロールバーのY座標
const PLAYER_Y_POINT        = SCREEN_HEIGHT-200;  // プレイヤーアイコンのY座標
const TIMER_Y_POINT         = 55;  // タイマーのY座標

// 基本150msの倍数で敵の動きは制御する。
const NEXT_PATTERN_INTERVAL   = 600; // ms
const NORMAL_PATTERN_INTERVAL = 600; // ms
const NARROW_PATTERN_INTERVAL = 300; // ms
const RUSH_PATTERN_INTERVAL   = 150; // ms
const NORMAL_PATTERN_ENEMY_COUNT   = 4;
const NARROW_PATTERN_ENEMY_COUNT   = 4;
const RUSH_PATTERN_ENEMY_COUNT     = 3;

const ENEMY_HEAP_UP_DURATION  = 750;  // ms
const ENEMY_MOVE_DURATION     = 1500; // ms

const ENEMY_COLOR = {
	"A": "hsl(120, 80%, 70%)",
	"B": "hsl(240, 80%, 70%)",
	"C": "hsl(360, 80%, 70%)"
};

// アセット
const ASSETS = {
	"profileIMG": "http://jsrun.it/assets/b/J/Y/F/bJYFb.jpg"
};

const FONT_FAMILY_FLAT= "'Helvetica-Light' 'Meiryo' sans-serif";  // フラットデザイン用フォント


/*
 * main
 */
tm.main(function() {
	var app = tm.display.CanvasApp("#world");
	app.resize(SCREEN_WIDTH, SCREEN_HEIGHT);
	app.fitWindow();
	app.background = "rgba(235, 235, 235, 1.0)";// 背景色
	app.fps = 55;
	
	// ローディング
	var loadingScene = tm.app.LoadingScene({
		width: SCREEN_WIDTH,	// 幅
		height: SCREEN_HEIGHT,	// 高さ
		assets: ASSETS,			// アセット(必須)
		nextScene: TitleScene	// ローディング完了後のシーン
	});
	app.replaceScene(loadingScene);

	// 実行
	app.run();
});

/*
 * title scene
 */
tm.define("TitleScene", {
	superClass: "tm.app.Scene",
	
	init: function() {
		this.superInit();
		
		this.fromJSON({
			children: [
				{
					type: "Label", name: "titleLabel",
					text: "Wave Weaver Parody",
					x: SCREEN_CENTER_X,
					y: 200,
					fillStyle: "#444",
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
					fillStyle: "#444",
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
	level: 0, // ゲームレベル(初回０。徐々に上がる？)
	
	init: function() {
		this.superInit();
		
		// Player描画
		Player().addChildTo(this);
		this.pMarker = Controller().addChildTo(this);
		
		var label = tm.display.Label("tmlib.js のテンプレートだよ♪");
		label.setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y);
		label.setAlign("center").setBaseline("middle");
		this.addChild(label);

		// Timer描画
		Timer().addChildTo(this);
		
		// 初回パターン生成
		this.createPattern(this);
	},

	update: function(app) {
		// 一連のパターンが判定終了したら、インターバルを置いた後、次のパターンへ。
		if (this.pattern && this.pattern.ended_flag) {
			this.pattern = null;
			setTimeout(this.createPattern, NEXT_PATTERN_INTERVAL, this);
		}
	},

	createPattern: function(obj) {
		obj.pattern = Pattern(obj.level).addChildTo(obj);
	}
});

/*
 * Pattern生成クラス（複数のエネミーと、アニメーション情報を持つ）
 * @param patternNum 0:ノーマル, 1:短感覚 , 2:ため高速
 * @param popPosition 0:左, 1:右
 */
// TODO 生成時にランダムで移動パターンを付与する。
// MEMO 4ノーマル、４短間隔、３ため高速（レベル１）
// レベルによって、パターンに含まれる波の総数が増えていく。
// 高速以外の一連のパターンは左右出現通しで固定。
/* Enemyの方のinit内でAnimation開始させてOK
 * Enemyの生成開始タイミングをずらすことで各Waveの間隔を演出
 */
tm.define("Pattern", {
	superClass: "tm.app.Object2D",
	ended_flag: false,
	patternNum: 0,
	popPosition: 0,

	init: function(level) {
		this.superInit();

		this.patternNum  = tm.util.Random.randint(0, 2);
		this.popPosition = tm.util.Random.randint(0, 1);
		
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

		// 時間差をつけて生成
		function popEnemy(){
			if (i == 0) {
				_this.ended_flag = true; // 次のパターン生成を許可
				return;
			}
			i--;
			Enemy(_this.patternNum, _this.popPosition).addChildTo(_this);
			setTimeout(function(){popEnemy(level)}, NORMAL_PATTERN_INTERVAL);
		}
		popEnemy();
	},

	createNarrow: function(level){
		var i = level + NARROW_PATTERN_ENEMY_COUNT;
		var _this = this;

		// 時間差をつけて生成
		function popEnemy(){
			if (i == 0) {
				_this.ended_flag = true; // 次のパターン生成を許可
				return;
			}
			i--;
			Enemy(_this.patternNum, _this.popPosition).addChildTo(_this);
			setTimeout(function(){popEnemy(level)}, NARROW_PATTERN_INTERVAL);
		}
		popEnemy();
	},

	createRush: function(level){
		var i = level + RUSH_PATTERN_ENEMY_COUNT;
		var _this = this;

		// 時間差をつけて生成
		function popEnemy(){
			if (i == 0) {
				_this.ended_flag = true; // 次のパターン生成を許可
				return;
			}
			i--;
			_this.switchPopPosition();
			Enemy(_this.patternNum, _this.popPosition).addChildTo(_this);
			setTimeout(function(){popEnemy(level)}, RUSH_PATTERN_INTERVAL);
		}
		popEnemy();
	},

	// 左右交互にEnemyがpopするよう
	switchPopPosition: function() {
		if (this.popPosition === 0) {
			this.popPosition = 1;
		} else if (this.popPosition === 1) {
			this.popPosition = 0;
		}
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

	init: function(patternNum, popPosition) {
		var width = 500, height = 500;
		this.superInit(width, height);

		// 開始時座標
		this.x = (popPosition === 0) ? 0 - width/5 : SCREEN_WIDTH + width/5;
		this.y = -height/2;

		// HSL色空間においてランダム色を作る
		var angle = tm.util.Random.randint(0, 360);
		var param = {
			fillStyle: "transparent",
			strokeStyle: "hsl({0}, 80%, 70%)".format(angle),
			lineWidth: "10",
		};
		// 円描画
		this.renderCircle(param);
		this.setInteractive(true);

		this.moveEnemy();
	},
	
	update: function(app) {
	},
	
	moveEnemy: function() {
		// TODO 敵の移動
		this.tweener
			.clear()
			.to({y: -100}, ENEMY_HEAP_UP_DURATION)
			.to({
				scaleX:5,
				scaleY:4,
				x:SCREEN_CENTER_X,
				y:SCREEN_CENTER_Y
			}, ENEMY_MOVE_DURATION)
			.call(function(){
				// 自分自身を破棄
				this.remove();
			}.bind(this))
		;
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
		TimerLabel().addChildTo(this);
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

		this.superInit(SCREEN_WIDTH, 65, param);
		this.originX = 0;
		this.y = TIMER_Y_POINT;
	}
});


/*
 * Player (ビートするやつ)
 */
tm.define("Player", {
	superClass: "tm.display.TriangleShape",
	color: null, // Controllerのcolorに対応

	init: function() {
		var width = 100, height = 100;
		var angle = tm.util.Random.randint(0, 360);
		var param = {
			fillStyle: "hsl({0}, 80%, 70%)".format(angle),
			strokeStyle: "hsl({0}, 40%, 35%)".format(angle),
			lineWidth: "2",
		};
		this.superInit(width, height, param);
		this.x = SCREEN_CENTER_X;
		this.y = PLAYER_Y_POINT;

		// リズムを刻む
		this.beat();
	},
	
	update: function(app) {
		// TODO colorを格納
	},
	
	beat: function(){
		this.tweener
			.clear()
			.to({scaleX:1.15, scaleY:1.15}, 400)
			.to({scaleX:1, scaleY:1}, 100)
			.call(function(){
				this.beat(); // 再帰呼び出し
			}.bind(this))
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
		ControllerPointer().addChildTo(this);
	},

	update: function() {
		// TODO colorを格納
	},
});
/*
 * プレイヤーが操作可能なポインター
 */
tm.define("ControllerPointer", {
	superClass: "tm.display.CircleShape",

	init: function() {
		var width = 60, height = 60;
		var param = {
			fillStyle: "#f5f5f5",
			strokeStyle: "hsl(250, 80%, 70%)",
			lineWidth: "25",
		};
		this.superInit(width, height, param);
		this.y = CONTROLLER_Y_POINT;
	},

	update: function(app) {
		var p = app.pointing;
		this.x = p.x;

		if (p.getPointing()) {
			//this.rotation += 10;
		}
	}
});
/*
 * プレイヤーが操作可能な部分の背景
 */
tm.define("ControllerBG", {
	superClass: "tm.app.Object2D",

	init: function() {
		this.superInit();

		ControllerBGPiece(ENEMY_COLOR.A, 0).addChildTo(this);
		ControllerBGPiece(ENEMY_COLOR.B, 1).addChildTo(this);
		ControllerBGPiece(ENEMY_COLOR.C, 2).addChildTo(this);
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
		this.superInit(SCREEN_WIDTH/3, 20, param);
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
		this.superInit("Excellent!", /*fontSize =*/ 20);

		this
			.setPosition(SCREEN_CENTER_X, 700)
			.setFillStyle("#fff")
			.setAlign("center")
			.setBaseline("middle")
			.setFontFamily(FONT_FAMILY_FLAT)
		;
	},

	update: function(app) {
		var time  = (this.time_counter/app.fps);
		if (time > display_sec){
			// TODO テキスト表示をフェードアウト
			this.tweener
				.clear()
				.fadeOut(300)
			;
		}
		this.time_counter++;
	}
});