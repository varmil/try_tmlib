// forked from phi's "template - tmlib.js 0.2.2" http://jsdo.it/phi/yRg0
// forked from phi's "template - tmlib.js 0.1.7" http://jsdo.it/phi/m68l
/*
 * tmlib.js 0.2.0
 */

 //  Integrate with Underscore.js without module loading
_.mixin(_.str.exports()); 

/*
 * contant
 */
var SCREEN_WIDTH	= 640;			  // スクリーン幅
var SCREEN_HEIGHT	= 960;			  // スクリーン高さ
var SCREEN_CENTER_X = SCREEN_WIDTH/2;   // スクリーン幅の半分
var SCREEN_CENTER_Y = SCREEN_HEIGHT/2;  // スクリーン高さの半分

// アセット
var ASSETS = {
	"profileIMG": "http://jsrun.it/assets/b/J/Y/F/bJYFb.jpg"
};

var FONT_FAMILY_FLAT= "'Helvetica-Light' 'Meiryo' sans-serif";  // フラットデザイン用フォント


const POP_TIME_SEC = 1.0;	// 敵のポップ時間
const MAX_ENEMY = 10;		// 画面内にいくつまで敵を描画するか

/*
 * main
 */
tm.main(function() {
	var app = tm.display.CanvasApp("#world");
	app.resize(SCREEN_WIDTH, SCREEN_HEIGHT);
	app.fitWindow();
	app.background = "rgba(250, 250, 250, 1.0)";// 背景色
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
	
	init: function() {
		this.superInit();
		
		this.star = tm.display.StarShape().addChildTo(this);
		
		var label = tm.display.Label("tmlib.js のテンプレートだよ♪");
		label.setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y);
		label.setAlign("center").setBaseline("middle");
		this.addChild(label);

		// 敵のコレクションを生成
		// this.enemyGroup = tm.app.CanvasElement();
		// this.addChild(this.enemyGroup);

		// Timer描画
		Timer().addChildTo(this);
	},
	
	update: function(app) {
		var p = app.pointing;
		this.star.x = p.x;
		this.star.y = p.y;

		if (p.getPointing()) {
			this.star.rotation += 32;
		}

		var time = (app.frame/app.fps);
		// 敵のPOP
		if (time % POP_TIME_SEC === 0){
			// 敵の生成
			// if (this.enemyGroup.children.length < MAX_ENEMY){
				// var enemy = Enemy().addChildTo(this.enemyGroup);
				var enemy = Enemy().addChildTo(this);
			// }
		}

		// TODO 敵の削除
		
	}
});

/*
 * Enemy
 */
tm.define("Enemy", {
    superClass: "tm.app.Shape",
	vx:0,
	vy:0,

    init: function() {
		var width = 900, height = 900;
        this.superInit(width, height);

		// 移動量をランダムで決定。
		this.vx = tm.util.Random.randint(1, 7);
		this.vy = tm.util.Random.randint(1, 7);

		// HSL色空間においてランダム色を作る
		var angle = tm.util.Random.randint(0, 360);
		var param = {
			fillStyle: "transparent",
			strokeStyle: "hsl({0}, 80%, 70%)".format(angle),
			lineWidth: "20",
		};
		// 円描画
		this.renderCircle(param);
		this.x = -width/4;
		this.y = -height/4;
		this.setInteractive(true);

		// Animation
		this.moveEnemy();
	},
	
	update: function(app) {
	},
	
	moveEnemy: function() {
		// TODO 敵の移動
		this.tweener
            .clear()
            .to({scaleX:1.15}, 600)
            .to({
				scaleX:2,
				scaleY:1.7,
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
    superClass: "tm.display.Label",
	time_counter: 0,

    init: function() {
		this.superInit("0", 80);

		// タイマーラベル
		this
			.setPosition(SCREEN_CENTER_X, 100)
			.setFillStyle("#333")
			.setAlign("center")
			.setBaseline("middle")
			.setFontFamily(FONT_FAMILY_FLAT)
	},

	update: function(app) {
        // タイマー更新
		var time  = (this.time_counter/app.fps);
		this.text = _.numberFormat(time, 2);
		this.time_counter++;
	}
});

/*
 * Player (ビートするやつ)
 */
tm.define("Player", {
    superClass: "tm.app.Shape",

    init: function() {

	},
	
	update: function(app) {

	}
});

/*
 * Controller (入力部分)
 */
tm.define("Controller", {
    superClass: "tm.app.Shape",

    init: function() {

	},
	
	update: function(app) {

	}
});