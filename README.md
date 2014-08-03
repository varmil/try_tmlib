[![Vote](http://voting-badge.herokuapp.com/img?url=https://github.com/varmil/try_tmlib)](http://voting-badge.herokuapp.com/vote?url=https://github.com/varmil/try_tmlib)

## Wave Fever

### Try tmlib.js !!
* Wave Weaver のパロディっぽいやつをさくっと作ってみよう
* ネイティブをどの程度Canvasで再現できるかの実験も含めて。



### 作ってみて
* ゲームライブラリは初めて触ったが、思ったよりは苦戦しなかった。大規模開発の際は、ViewとLogicの分離をはっきりさせないと苦しいだろうな...
* `tmlib.js`作者であるphiさんの神がかった対応によりChromeでも、AssetManager通してSound再生できた。
* が、どうもSEが重なる部分で上手く行かなかったので、結局Soundの取り扱いには`boombox`を用いた。
* やはり60fps厳しい！GCを一度も起こさない設計が必要だと感じた。`Wave Fever`では、Waveの生成破棄で`new`してしまっているのでGCが必然的に発生する。今の実力では代替案が思い浮かばない。
* `underscore`の`chain()`が強力。



### 参考（逐次追加）
* [TM Life powered by FeedBurner][1]
* [tmlib.js 100 サンプル!! 解説一覧][2]




[1]: http://feeds.feedburner.com/tmlife/feed
[2]: http://rakuyudo.com/tmlib-js-samplelist/