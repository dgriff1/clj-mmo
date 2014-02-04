
import random


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

MAX_ITER = 10000
exportList = generator_base(MAX_ITER, "GRASS", "terrain")
exportList = exportList + generator_base(MAX_ITER, "TREE", "entity", 7)

writeToFile(exportList)
