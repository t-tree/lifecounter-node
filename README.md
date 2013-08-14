LifeCounter
======================
Webで使えるTCG（MTG）向けライフカウンター。 
 
Twitter認証で参加してルームを作成。  
対戦相手にルームに参加してもらえば後はいわゆるライフカウンターアプリと同じように動きます。

### 特徴 ###
+ 部屋に参加している全ての人のライフを見ることができます
+ socket.ioを使っているので全員のライフがある程度リアルタイムに同期します

### 注意 ###
+ 携帯端末なんかで使うとバッテリーの減りが激しいです
+ 作者の勉強がてらつくったところが大きく、コードはあまり美しくないです。
+ 後述しますが、いろいろ環境変数などの設定が必要になります。


使い方
------
### 準備 ###

下記の項目を設定する必要があります  
export TWITTER_CONSUMER_KEY= TwitterのCONSUMER key  
export TWITTER_CONSUMER_SECRET=TwitterのSeacret Key  
export TWITTER_CALL_BACK_URL=Twitterのコールバックキー  
export ADMINISTRATOR=管理者のTwitterID  

### 実行方法 ###

node app.js 

で起動するはず。
 
 
参考にした情報
--------
色々参考にさせてもらったのでなるべく書きます。   
しばらくお待ちを。。
 
今後の予定
--------
いろいろ使ってみて問題とか欲しい機能とかあるので作る予定。

ライセンス
----------
Copyright &copy; 2013 Masaki Naito  
Licensed under the [Apache License, Version 2.0][Apache]
 
[Apache]: http://www.apache.org/licenses/LICENSE-2.0