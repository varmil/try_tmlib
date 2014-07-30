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
const SCREEN_WIDTH	= 640;			  // スクリーン幅
const SCREEN_HEIGHT	= 960;			  // スクリーン高さ
const SCREEN_CENTER_X = SCREEN_WIDTH/2;   // スクリーン幅の半分
const SCREEN_CENTER_Y = SCREEN_HEIGHT/2;  // スクリーン高さの半分

// User定義パラメータ
const POP_TIME_SEC          = 1.0;	// 敵のポップ時間
const MAX_ENEMY             = 10;	// 画面内にいくつまで敵を描画するか
const CONTROLLER_Y_POINT    = SCREEN_HEIGHT-100;	// コントロールバーのY座標
const PLAYER_Y_POINT        = SCREEN_HEIGHT-200;	// プレイヤーアイコンのY座標
const TIMER_Y_POINT         = 55;	// タイマーのY座標

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
	app.fps = 60;
	
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
	level: 1, // ゲームレベル
	
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
		
		// TODO 初回パターン生成。
		this.pattern = Pattern(this.level).addChildTo(this);
	},

	update: function(app) {
		var time = (app.frame/app.fps);
		// TODO 敵のPOP DELETE ME After.
		// if (time % POP_TIME_SEC === 0){
			// 敵の生成
			// var enemy = Enemy().addChildTo(this);
		// }
		// TODO 一連のパターンが判定終了したら次のパターンへ。
		if (this.pattern.ended_flag) {
			this.pattern = Pattern(this.level).addChildTo(this);
		}
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

		// DEBUG とりあえずデフォルト値を返す。実装できたらコメントアウト外す
		// this.patternNum  = tm.util.Random.randint(0, 2);
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
		var i;
		// TODO 時間差をつけて生成
		for (i=0; i<level+3; i++){
			Enemy(this.patternNum, this.popPosition).addChildTo(this);
		}
	},

	createNarrow: function(level){
	
	},

	createRush: function(level){
	
	},
});
/*
 * Enemy
 * @param int patternNum
 * @param int left or right (出現位置)
 */
tm.define("Enemy", {
    superClass: "tm.app.Shape",

    init: function(patternNum, popPosition) {
		var width = 500, height = 500;
        this.superInit(width, height);

		// 開始時座標
		this.x = -width/4;
		this.y = -height/4;
		// 移動量をランダムで決定。
		// this.vx = tm.util.Random.randint(1, 7);
		// this.vy = tm.util.Random.randint(1, 7);

		// HSL色空間においてランダム色を作る
		var angle = tm.util.Random.randint(0, 360);
		var param = {
			fillStyle: "transparent",
			strokeStyle: "hsl({0}, 80%, 70%)".format(angle),
			lineWidth: "13",
		};
		// 円描画
		this.renderCircle(param);
		this.setInteractive(true);

		// TODO Animation
		this.moveEnemy();
	},
	
	update: function(app) {
	},
	
	moveEnemy: function() {
		// TODO 敵の移動
		this.tweener
            .clear()
            .to({scaleX:1.2, scaleY:1.2}, 600)
            .to({
				scaleX:5,
				scaleY:3,
				x:SCREEN_CENTER_X,
				y:SCREEN_CENTER_Y
			}, 1000)
			.call(function(){
				// 自分自身を破棄
				this.remove();
				delete this;
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

    init: function() {
		this.superInit();

		// 背景
		ControllerBG().addChildTo(this);
		ControllerPointer().addChildTo(this);
	}
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
			strokeStyle: "hsl(150, 80%, 70%)",
			lineWidth: "18",
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
    superClass: "tm.display.RectangleShape",

    init: function() {
		var angle = tm.util.Random.randint(0, 360);
		var param = {
			fillStyle: "hsla({0}, 80%, 70%, 0.3)".format(angle),
			strokeStyle: "transparent",
			lineWidth: "0",
		};
		this.superInit(SCREEN_WIDTH, 20, param);
		this.originX = 0;
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