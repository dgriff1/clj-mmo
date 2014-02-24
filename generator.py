
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
			if r <= chance:
				x = x * 64 + x1 
				y = y * 32 + y1 
				exportList.append({"location" : {"x" : x, "y" : y}, "resource" : image, "type" : type})
		
	s = None
	return exportList	

def writeToFile(exportList):
	export = '['
	for e in exportList:
		row = '{:location {:x %f :y %f} :resource "%s" :type %s } ' % (e['location']['x'], e['location']['y'], e['resource'], e['type'])
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

for i in range(300, 320):
    obj = exportList[i]
    obj['resource'] = 'BEACH'
    if exportList[i - 1]['location']['y'] < obj['location']['y']:
    	adjObj = getObj(obj['location']['x'] - 32, obj['location']['y'] - 16, exportList)
    	adjObj['resource'] = 'BEACH_EDGE_RIGHT'
    	adjObj = getObj(obj['location']['x'] + 32, obj['location']['y'] + 16, exportList)
    	adjObj['resource'] = 'BEACH_EDGE_LEFT'
    else:
    	adjObj = getObj(obj['location']['x'] - 32, obj['location']['y'] - 16, exportList)
    	adjObj['resource'] = 'BEACH_EDGE_DOWN'
    	adjObj = getObj(obj['location']['x'] + 32, obj['location']['y'] + 16, exportList)
    	adjObj['resource'] = 'BEACH_EDGE_UP'
	

#exportList = exportList + generator_base(MAX_ITER, "TREE", "entity", 7)

writeToFile(exportList)
