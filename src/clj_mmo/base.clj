(ns clj-mmo.base
	)

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

(defn player-rec [id items attributes techtree] 
	(entity "player" { :id id :attributes attributes :techtree techtree :location [0 0] :health 100 }) ) 

(defn move? [player] 
	true)

(defn move [player] 
	(assoc player :location [1 1]))
	
(defn  take_damage? [player] 
	true) 

(defn take_damage [ player ] 
	(assoc player :health 90))
	

(defn on_move [ player  ] 
	(cond-> player
		move?  move
		take_damage? take_damage
	))
		
