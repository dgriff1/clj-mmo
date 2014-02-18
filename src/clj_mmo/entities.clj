(ns clj-mmo.entities
	(:require [ clj-mmo.db :as db] ) ) 

(defn read-it [ file_name ] 
	(db/delete-all-entities)
	(dorun (map 
				(fn [m] 
					(do 
						(prn m )
						(db/persist-entity m)
					)
				) (read-string (slurp file_name)))))

(defn -main [file_name ]
	(read-it file_name))

