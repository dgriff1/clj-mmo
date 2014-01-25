
export = ''
export += '['

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


for j in range(0, 2):
	if j == 1:
		x1 = 32
		y1 = 15
		image = "GRASS"
	else:
		x1 = 0
		y1 = 0
		image = "GRASS"
	s = None
	s = spiral(1000, 1000)
	i = 0
	while i < 20000:
		(x, y) = s.next()
		x = (x * 64) + x1
		y = (y * 32) + y1
		i = i + 1
		row = '{:location {:x %f :y %f} :resource "%s" :type "terrain" } ' % (x, y, image)
		export += row
	

export += ']'

f = open('doc/data.dat', 'w')
f.write(export)
f.close()
