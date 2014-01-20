(ns clj-mmo.util)

(defn safe-player [ p ]
    (assoc p (dissoc p :channel :adjacency :socket) :type 4))

