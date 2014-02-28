(ns clj-mmo.util)

(defn safe-player [ p ]
    (assoc (dissoc p :channel :adjacency :socket :lock_future ) :type "player"))

