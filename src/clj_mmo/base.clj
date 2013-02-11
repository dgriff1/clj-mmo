(ns clj-mmo.base) 

(defn player-rec [id items attributes techtree] 
	{ :id id :attributes attributes :techtree techtree } ) 

(defprotocol weapon 
	(attack  [from target] "Attack a target" ) )

(defprotocol skill 
	(useit [source components] "Use the skill on a set of components"))


(defprotocol food 
	(eat [source food] "Eat some food"))
