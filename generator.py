
import random

MAX_ITER = 5000

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
	exportList = []
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
				exportList.append({"location" : {"x" : x, "y" : y}, "resource" : image, "type" : type})
		
	s = None
	return exportList	

def writeToFile(exportList):
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

def getObj(x, y, List):
    for i in List:
        if i['location']['x'] == x and i['location']['y'] == y:
            return i
    return None


def makePonds(x, y, exportList):
    size = random.randrange(1, 100)
    waterList = generator_base(size, "WATER", "terrain", chance=100)
    for water in waterList:
        o = getObj(x + water['location']['x'], y + water['location']['y'], exportList)
        if o:
            o['resource'] = "WATER"
    return exportList

def makeRiver():
    pass

waterTiles = []
for tile in exportList:
    waterchance = random.randrange(0, 1000)
    if waterchance > 998:
        waterTiles.append(tile)

for tile in waterTiles:
    exportList = makePonds(tile['location']['x'], tile['location']['y'], exportList)

exportList.reverse()
for i in exportList:
    if i['resource'] == 'WATER':
       obj = getObj(i['location']['x'] - 32 , i['location']['y'] - 16, exportList)
       if obj and obj['resource'] == 'GRASS':
           obj['resource'] = 'WATER_GRASS'
           obj['direction'] = 'RIGHT'
       obj = getObj(i['location']['x'] - 32 , i['location']['y'] + 16, exportList)
       if obj and obj['resource'] == 'GRASS':
           obj['resource'] = 'WATER_GRASS'
           obj['direction'] = 'RIGHT'
       obj = getObj(i['location']['x'] + 32 , i['location']['y'] + 16, exportList)
       if obj and obj['resource'] == 'GRASS':
           obj['resource'] = 'WATER_GRASS'
           obj['direction'] = 'LEFT'
       obj = getObj(i['location']['x'] + 32 , i['location']['y'] + 16, exportList)
       if obj and obj['resource'] == 'GRASS':
           obj['resource'] = 'WATER_GRASS'
           obj['direction'] = 'LEFT'
       obj = getObj(i['location']['x']  , i['location']['y'] + 32, exportList)
       if obj and obj['resource'] == 'GRASS':
           obj['resource'] = 'WATER_GRASS'
           obj['direction'] = 'UP'
       obj = getObj(i['location']['x']  , i['location']['y'] - 32, exportList)
       if obj and obj['resource'] == 'GRASS':
           obj['resource'] = 'WATER_GRASS'
           obj['direction'] = 'DOWN'
exportList.reverse()

for e in exportList:
    if e['resource'] == "GRASS":
        r = random.randrange(0, 100)
        if r > 90:
		exportList.append({"location" : {"x" : e['location']['x'], "y" : e['location']['y'] + 32}, "resource" : "TREE", "type" : "entity"})
        
writeToFile(exportList)
