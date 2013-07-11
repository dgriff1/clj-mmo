(ns clj-mmo.util)

(defn safe_player [ p ]
    (dissoc p :channel :adjacency :socket))
