(ns clj-mmo.entity-tests
  (:use clojure.test
        clj-mmo.db))

(deftest create-entity-test
	(delete_all_entities) 
	(let 
		[
			e-one (persist_entity { :location { :x 0 :y 0 } :type "terrain" :resource "mud.png" } ) 
			e-two (persist_entity { :location { :x 0 :y 0 } :type "tree" :resource "tree.png" } )  
			e-three (persist_entity { :location { :x 500 :y 0 } :type "tree" :resource "tree.png" } )  
			e-four (persist_entity { :location { :x 0 :y 401 } :type "tree" :resource "tree.png" } )  
			e-five (persist_entity { :location { :x 401 :y 401 } :type "tree" :resource "tree.png" } )  
			close_e (get_close_entities 0 0)
		]
		(do 
			(is (= 2 (count close_e))))
			
  )) 

