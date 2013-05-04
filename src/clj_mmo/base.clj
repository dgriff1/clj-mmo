(ns clj-mmo.base
	(:use clj-mmo.actions))

(defn base_type [ target ]  
	(merge  {:actions [] :behaviors []} target))

(defn entity [ ename edef ] 
	(assoc (base_type edef) :name ename))

(defn action [ body ] 
	(base_type {:action (fn [t] body)}  ))

(defn behavior [ guard body ] 
	(fn [source target action] guard body))

(defn tech [ body ] 
	(fn [source target activity] (base_type body)))

(defn player-attributes [ ]
	{ :might 3 :meat 3 :mental 3 :asphyxiation 100 :thirst  100 :hunger 100 :exposure 100 })

(defn player-rec [id items attributes techtree] 
	(entity "player" { :_id id :attributes attributes :techtree techtree :conditions [] :health 100 :location { :x 0 :y 0} }) ) 

(defn on_move [ player evt ctx ] 
	(cond-> player
		(move? player evt ctx)  (move evt ctx)
		(take_damage? player evt ctx) (take_damage evt ctx)
	))
