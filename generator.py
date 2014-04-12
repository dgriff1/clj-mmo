
import random

MAX_ITER = 5000

exportList = []

def spiral(X, Y):
	x = y = 0
	dx = 0
	dy = -1
	for i in range(max(X, Y)**2):
		if (-X/2 < x <= X/2) and (-Y/2 < y <= Y/2):
			yield (x, y)
			# DO STUFF...
		if x == y or (x < 0 and x == -y) or (x > 0 and x == 1-y):
			dx, dy = -dy, dx
		x, y = x+dx, y+dy

def generator_base(MAX_ITER, image, type, chance=100):
	smallList = []
	for square_shift in range(0, 2):
		x1 = 32 * square_shift
		y1 = 16 * square_shift
		s = spiral(MAX_ITER, MAX_ITER)
		i = 0
		while i < MAX_ITER:
			r = random.randrange(0, 100)
			(x, y) = s.next()
			i = i + 1
			if r < chance:
				x = x * 64 + x1 
				y = y * 32 + y1 
				smallList.append({"location" : {"x" : x, "y" : y}, "resource" : image, "type" : type})
		
	s = None
	return smallList	

def writeToFile():
	export = '['
	for e in exportList:
		direction = ''
		if 'direction' in e:
                    direction = ':direction "' + e['direction'] + '"'
		row = '{:location {:x %f :y %f} :resource "%s" :type %s %s} ' % (e['location']['x'], e['location']['y'], e['resource'], e['type'], direction)
		export += row
	export += ']'
	
	f = open('doc/data.dat', 'w')
	f.write(export)
	f.close()

exportList = generator_base(MAX_ITER, "GRASS", "terrain")

def getObj(x, y):
    for i in exportList:
        if i['location']['x'] == x and i['location']['y'] == y:
            return i
    return None


def makePond(x, y):
    size = random.randrange(1, 100)
    waterList = generator_base(size, "WATER", "terrain", chance=100)
    for water in waterList:
        o = getObj(x + water['location']['x'], y + water['location']['y'])
        if o:
            o['resource'] = "WATER"

def makeRiver():
    pass

def makePonds():
    waterTiles = []
    for tile in exportList:
        waterchance = random.randrange(0, 1000)
        if waterchance > 998:
            waterTiles.append(tile)
    
    for tile in waterTiles:
        makePond(tile['location']['x'], tile['location']['y'])
    buildEdges("WATER")

def buildEdges(tileType):
    exportList.reverse()
    for i in exportList:
        if i['resource'] == tileType:
            obj = getObj(i['location']['x'] - 32 , i['location']['y'] - 16)
            if obj and obj['resource'] == 'GRASS':
                obj['resource'] = '%s_GRASS' % (tileType,)
                obj['direction'] = 'RIGHT'
            obj = getObj(i['location']['x'] - 32 , i['location']['y'] + 16)
            if obj and obj['resource'] == 'GRASS':
                obj['resource'] = '%s_GRASS' % (tileType,)
                obj['direction'] = 'RIGHT'
            obj = getObj(i['location']['x'] + 32 , i['location']['y'] + 16)
            if obj and obj['resource'] == 'GRASS':
                obj['resource'] = '%s_GRASS' % (tileType,)
                obj['direction'] = 'LEFT'
            obj = getObj(i['location']['x'] + 32 , i['location']['y'] + 16)
            if obj and obj['resource'] == 'GRASS':
                obj['resource'] = '%s_GRASS' % (tileType,)
                obj['direction'] = 'LEFT'
            obj = getObj(i['location']['x']  , i['location']['y'] + 32)
            if obj and obj['resource'] == 'GRASS':
                obj['resource'] = '%s_GRASS' % (tileType,)
                obj['direction'] = 'UP'
            obj = getObj(i['location']['x']  , i['location']['y'] - 32)
            if obj and obj['resource'] == 'GRASS':
                obj['resource'] = '%s_GRASS' % (tileType,)
                obj['direction'] = 'DOWN'
    exportList.reverse()

makePonds()
writeToFile()

#for e in exportList:
#    if e['resource'] == "GRASS":
#        r = random.randrange(0, 100)
#        if r > 90:
#		exportList.append({"location" : {"x" : e['location']['x'], "y" : e['location']['y'] + 32}, "resource" : "TREE", "type" : "entity"})
        
