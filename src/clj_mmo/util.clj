(ns clj-mmo.util)

(defn safe-player [ p ]
    (dissoc p :channel :adjacency :socket))
