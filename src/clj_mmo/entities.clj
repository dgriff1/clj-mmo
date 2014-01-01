(ns clj-mmo.entities
	(:use clj-mmo.db) ) 

(defn read-it [ file_name ] 
	(dorun (map 
				(fn [m] 
					(do 
						(prn m )
						(persist-entity m)
					)
				) (read-string (slurp file_name)))))

(defn -main [file_name ]
	(read-it file_name))

