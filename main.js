var events = new Events();
events.add = function(obj) {
  obj.events = { };
}
events.implement = function(fn) {
  fn.prototype = Object.create(Events.prototype);
}

function Events() {
  this.events = { };
}
Events.prototype.on = function(name, fn) {
  var events = this.events[name];
  if (events == undefined) {
    this.events[name] = [ fn ];
    this.emit('event:on', fn);
  } else {
    if (events.indexOf(fn) == -1) {
      events.push(fn);
      this.emit('event:on', fn);
    }
  }
  return this;
}
Events.prototype.once = function(name, fn) {
  var events = this.events[name];
  fn.once = true;
  if (!events) {
    this.events[name] = [ fn ];
    this.emit('event:once', fn);
  } else {
    if (events.indexOf(fn) == -1) {
      events.push(fn);
      this.emit('event:once', fn);
    }
  }
  return this;
}
Events.prototype.emit = function(name, args) {
  var events = this.events[name];
  if (events) {
    var i = events.length;
    while(i--) {
      if (events[i]) {
        events[i].call(this, args);
        if (events[i].once) {
          delete events[i];
        }
      }
    }
  }
  return this;
}
Events.prototype.unbind = function(name, fn) {
  if (name) {
    var events = this.events[name];
    if (events) {
      if (fn) {
        var i = events.indexOf(fn);
        if (i != -1) {
          delete events[i];
        }
      } else {
        delete this.events[name];
      }
    }
  } else {
    delete this.events;
    this.events = { };
  }
  return this;
}

var userPrefix;

var prefix = (function () {
  var styles = window.getComputedStyle(document.documentElement, ''),
    pre = (Array.prototype.slice
      .call(styles)
      .join('') 
      .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
    )[1],
    dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
  userPrefix = {
    dom: dom,
    lowercase: pre,
    css: '-' + pre + '-',
    js: pre[0].toUpperCase() + pre.substr(1)
  };
})();

function bindEvent(element, type, handler) {
  if(element.addEventListener) {
    element.addEventListener(type, handler, false);
  } else {
    element.attachEvent('on' + type, handler);
  }
}

function Viewport(data) {
  events.add(this);

  var self = this;

  this.element = data.element;
  this.fps = data.fps;
  this.sensivity = data.sensivity;
  this.sensivityFade = data.sensivityFade;
  this.touchSensivity = data.touchSensivity;
  this.speed = data.speed;

  this.lastX = 0;
  this.lastY = 0;
  this.mouseX = 0;
  this.mouseY = 0;
  this.distanceX = 0;
  this.distanceY = 0;
  this.positionX = 1122;
  this.positionY = 136;
  this.torqueX = 0;
  this.torqueY = 0;

  this.down = false;
  this.upsideDown = false;

  this.previousPositionX = 0;
  this.previousPositionY = 0;

  this.currentSide = 0;
  this.calculatedSide = 0;


  bindEvent(document, 'mousedown', function() {
    self.down = true;
  });

  bindEvent(document, 'mouseup', function() {
    self.down = false;
  });
  
  bindEvent(document, 'keyup', function() {
    self.down = false;
  });

  bindEvent(document, 'mousemove', function(e) {
    self.mouseX = e.pageX;
    self.mouseY = e.pageY;
  });

  bindEvent(document, 'touchstart', function(e) {

    self.down = true;
    e.touches ? e = e.touches[0] : null;
    self.mouseX = e.pageX / self.touchSensivity;
    self.mouseY = e.pageY / self.touchSensivity;
    self.lastX  = self.mouseX;
    self.lastY  = self.mouseY;
  });

  bindEvent(document, 'touchmove', function(e) {
    if(e.preventDefault) { 
      e.preventDefault();
    }

    if(e.touches.length == 1) {

      e.touches ? e = e.touches[0] : null;

      self.mouseX = e.pageX / self.touchSensivity;
      self.mouseY = e.pageY / self.touchSensivity;

    }
  });

  bindEvent(document, 'touchend', function(e) {
    self.down = false;
  });  

  setInterval(this.animate.bind(this), this.fps);

}
events.implement(Viewport);
Viewport.prototype.animate = function() {

  this.distanceX = (this.mouseX - this.lastX);
  this.distanceY = (this.mouseY - this.lastY);

  this.lastX = this.mouseX;
  this.lastY = this.mouseY;

  if(this.down) {
    this.torqueX = this.torqueX * this.sensivityFade + (this.distanceX * this.speed - this.torqueX) * this.sensivity;
    this.torqueY = this.torqueY * this.sensivityFade + (this.distanceY * this.speed - this.torqueY) * this.sensivity;
  }

  if(Math.abs(this.torqueX) > 1.0 || Math.abs(this.torqueY) > 1.0) {
    if(!this.down) {
      this.torqueX *= this.sensivityFade;
      this.torqueY *= this.sensivityFade;
    }

    this.positionY -= this.torqueY;

    if(this.positionY > 360) {
      this.positionY -= 360;
    } else if(this.positionY < 0) {
      this.positionY += 360;
    }

    if(this.positionY > 90 && this.positionY < 270) {
      this.positionX -= this.torqueX;

      if(!this.upsideDown) {
        this.upsideDown = true;
        this.emit('upsideDown', { upsideDown: this.upsideDown });
      }

    } else {

      this.positionX += this.torqueX;

      if(this.upsideDown) {
        this.upsideDown = false;
        this.emit('upsideDown', { upsideDown: this.upsideDown });
      }
    }

    if(this.positionX > 360) {
      this.positionX -= 360;
    } else if(this.positionX < 0) {
      this.positionX += 360;
    }

    if(!(this.positionY >= 46 && this.positionY <= 130) && !(this.positionY >= 220 && this.positionY <= 308)) {
      if(this.upsideDown) {
        if(this.positionX >= 42 && this.positionX <= 130) {
          this.calculatedSide = 3;
        } else if(this.positionX >= 131 && this.positionX <= 223) {
          this.calculatedSide = 2;
        } else if(this.positionX >= 224 && this.positionX <= 314) {
          this.calculatedSide = 5;
        } else {
          this.calculatedSide = 4;
        }
      } else {
        if(this.positionX >= 42 && this.positionX <= 130) {
          this.calculatedSide = 5;
        } else if(this.positionX >= 131 && this.positionX <= 223) {
          this.calculatedSide = 4;
        } else if(this.positionX >= 224 && this.positionX <= 314) {
          this.calculatedSide = 3;
        } else {
          this.calculatedSide = 2;
        }
      }
    } else {
      if(this.positionY >= 46 && this.positionY <= 130) {
        this.calculatedSide = 6;
      }

      if(this.positionY >= 220 && this.positionY <= 308) {
        this.calculatedSide = 1;
      }
    }

    if(this.calculatedSide !== this.currentSide) {
      this.currentSide = this.calculatedSide;
      this.emit('sideChange');
    }

  }

  this.element.style[userPrefix.js + 'Transform'] = 'rotateX(' + this.positionY + 'deg) rotateY(' + this.positionX + 'deg)';

  if(this.positionY != this.previousPositionY || this.positionX != this.previousPositionX) {
    this.previousPositionY = this.positionY;
    this.previousPositionX = this.positionX;

    this.emit('rotate');

  }

}
var viewport = new Viewport({
  element: document.getElementsByClassName('cube')[0],
  fps: 20,
  sensivity: .1,
  sensivityFade: .93,
  speed: 2,
  touchSensivity: 1.5
});

function Cube(data) {
  var self = this;

  this.element = data.element;
  this.sides = this.element.getElementsByClassName('side');

  this.viewport = data.viewport;
  this.viewport.on('rotate', function() {
    self.rotateSides();
  });
  this.viewport.on('upsideDown', function(obj) {
    self.upsideDown(obj);
  });
  this.viewport.on('sideChange', function() {
    self.sideChange();
  });
}
Cube.prototype.rotateSides = function() {
  var viewport = this.viewport;
  if(viewport.positionY > 90 && viewport.positionY < 270) {
    this.sides[0].getElementsByClassName('cube-image')[0].style[userPrefix.js + 'Transform'] = 'rotate(' + (viewport.positionX + viewport.torqueX) + 'deg)';
    this.sides[5].getElementsByClassName('cube-image')[0].style[userPrefix.js + 'Transform'] = 'rotate(' + -(viewport.positionX + 180 + viewport.torqueX) + 'deg)';
  } else {
    this.sides[0].getElementsByClassName('cube-image')[0].style[userPrefix.js + 'Transform'] = 'rotate(' + (viewport.positionX - viewport.torqueX) + 'deg)';
    this.sides[5].getElementsByClassName('cube-image')[0].style[userPrefix.js + 'Transform'] = 'rotate(' + -(viewport.positionX + 180 - viewport.torqueX) + 'deg)';
  }
}
Cube.prototype.upsideDown = function(obj) {

  var deg = (obj.upsideDown == true) ? '180deg' : '0deg';
  var i = 5;

  while(i > 0 && --i) {
    this.sides[i].getElementsByClassName('cube-image')[0].style[userPrefix.js + 'Transform'] = 'rotate(' + deg + ')';
  }

}
Cube.prototype.sideChange = function() {

  for(var i = 0; i < this.sides.length; ++i) {
    this.sides[i].getElementsByClassName('cube-image')[0].className = 'cube-image';    
  }

  this.sides[this.viewport.currentSide - 1].getElementsByClassName('cube-image')[0].className = 'cube-image active';

}

new Cube({
  viewport: viewport,
  element: document.getElementsByClassName('cube')[0]
});

// initialize
document.addEventListener("DOMContentLoaded", function() {
	demo.init();
	window.addEventListener('resize', demo.resize);
});

// demo namespace
var demo = {
	// CUSTOMIZABLE PROPERTIES
	// - physics speed multiplier: allows slowing down or speeding up simulation
	speed: 2,
	// - color of particles
	color: {
		r: '80',
		g: '175',
		b: '255',
		a: '0.5'
	},
	
	// END CUSTOMIZATION
	// whether demo is running
	started: false,
	// canvas and associated context references
	canvas: null,
	ctx: null,
	// viewport dimensions (DIPs)
	width: 0,
	height: 0,
	// devicePixelRatio alias (should only be used for rendering, physics shouldn't care)
	dpr: window.devicePixelRatio || 1,
	// time since last drop
	drop_time: 0,
	// ideal time between drops (changed with mouse/finger)
	drop_delay: 25,
	// wind applied to rain (changed with mouse/finger)
	wind: 4,
	// color of rain (set in init)
	rain_color: null,
	rain_color_clear: null,
	// rain particles
	rain: [],
	rain_pool: [],
	// rain droplet (splash) particles
	drops: [],
	drop_pool: []
};

// demo initialization (should only run once)
demo.init = function() {
	if (!demo.started) {
		demo.started = true;
		demo.canvas = document.getElementById('canvas');
		demo.ctx = demo.canvas.getContext('2d');
		var c = demo.color;
		demo.rain_color = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + c.a + ')';
		demo.rain_color_clear = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0)';
		demo.resize();
		Ticker.addListener(demo.step);
		
		// 
		const gui = new dat.GUI();
		gui.add(demo, 'speed', 0.2, 2);
		
		// fade out instructions after a few seconds
		var instructions = document.getElementById('instructions');
		setTimeout(function() {
			instructions.style.opacity = 0;
			setTimeout(function(){
				instructions.parentNode.removeChild(instructions);
			}, 2000);
		}, 4000);
	}
}

// (re)size canvas (clears all particles)
demo.resize = function() {
	// localize common references
	var rain = demo.rain;
	var drops = demo.drops;
	// recycle particles
	for (var i = rain.length - 1; i >= 0; i--) {
			rain.pop().recycle();
	}
	for (var i = drops.length - 1; i >= 0; i--) {
			drops.pop().recycle();
	}
	// resize
	demo.width = window.innerWidth;
	demo.height = window.innerHeight;
	demo.canvas.width = demo.width * demo.dpr;
	demo.canvas.height = demo.height * demo.dpr;
}

demo.step = function(time, lag) {
	// localize common references
	var demo = window.demo;
	var speed = demo.speed;
	var width = demo.width;
	var height = demo.height;
	var wind = demo.wind;
	var rain = demo.rain;
	var rain_pool = demo.rain_pool;
	var drops = demo.drops;
	var drop_pool = demo.drop_pool;
	
	// multiplier for physics
	var multiplier = speed * lag;
	
	// spawn drops
	demo.drop_time += time * speed;
	while (demo.drop_time > demo.drop_delay) {
		demo.drop_time -= demo.drop_delay;
		var new_rain = rain_pool.pop() || new Rain();
		new_rain.init();
		var wind_expand = Math.abs(height / new_rain.speed * wind); // expand spawn width as wind increases
		var spawn_x = Math.random() * (width + wind_expand);
		if (wind > 0) spawn_x -= wind_expand;
		new_rain.x = spawn_x;
		rain.push(new_rain);
	}
	
	// rain physics
	for (var i = rain.length - 1; i >= 0; i--) {
		var r = rain[i];
		r.y += r.speed * r.z * multiplier;
		r.x += r.z * wind * multiplier;
		// remove rain when out of view
		if (r.y > height) {
			// if rain reached bottom of view, show a splash
			r.splash();
		}
		// recycle rain
		if (r.y > height + Rain.height * r.z || (wind < 0 && r.x < wind) || (wind > 0 && r.x > width + wind)) {
			r.recycle();
			rain.splice(i, 1);
		}
	}
	
	// splash drop physics
	var drop_max_speed = Drop.max_speed;
	for (var i = drops.length - 1; i >= 0; i--) {
		var d = drops[i];
		d.x += d.speed_x * multiplier;
		d.y += d.speed_y * multiplier;
		// apply gravity - magic number 0.3 represents a faked gravity constant
		d.speed_y += 0.3 * multiplier;
		// apply wind (but scale back the force)
		d.speed_x += wind / 25 * multiplier;
		if (d.speed_x < -drop_max_speed) {
			d.speed_x = -drop_max_speed;
		}else if (d.speed_x > drop_max_speed) {
			d.speed_x = drop_max_speed;
		}
		// recycle
		if (d.y > height + d.radius) {
			d.recycle();
			drops.splice(i, 1);
		}
	}
	
	demo.draw();
}

demo.draw = function() {
	// localize common references
	var demo = window.demo;
	var width = demo.width;
	var height = demo.height;
	var dpr = demo.dpr;
	var rain = demo.rain;
	var drops = demo.drops;
	var ctx = demo.ctx;
	
	// start fresh
	ctx.clearRect(0, 0, width*dpr, height*dpr);
	
	// draw rain (trace all paths first, then stroke once)
	ctx.beginPath();
	var rain_height = Rain.height * dpr;
	for (var i = rain.length - 1; i >= 0; i--) {
		var r = rain[i];
		var real_x = r.x * dpr;
		var real_y = r.y * dpr;
		ctx.moveTo(real_x, real_y);
		// magic number 1.5 compensates for lack of trig in drawing angled rain
		ctx.lineTo(real_x - demo.wind * r.z * dpr * 1.5, real_y - rain_height * r.z);
	}
	ctx.lineWidth = Rain.width * dpr;
	ctx.strokeStyle = demo.rain_color;
	ctx.stroke();
	
	// draw splash drops (just copy pre-rendered canvas)
	for (var i = drops.length - 1; i >= 0; i--) {
		var d = drops[i];
		var real_x = d.x * dpr - d.radius;
		var real_y = d.y * dpr - d.radius;
		ctx.drawImage(d.canvas, real_x, real_y);
	}
}


// Rain definition
function Rain() {
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.speed = 25;
	this.splashed = false;
}
Rain.width = 2;
Rain.height = 40;
Rain.prototype.init = function() {
	this.y = Math.random() * -100;
	this.z = Math.random() * 0.5 + 0.5;
	this.splashed = false;
}
Rain.prototype.recycle = function() {
	demo.rain_pool.push(this);
}
// recycle rain particle and create a burst of droplets
Rain.prototype.splash = function() {
	if (!this.splashed) {
		this.splashed = true;
		var drops = demo.drops;
		var drop_pool = demo.drop_pool;

		for (var i=0; i<16; i++) {
			var drop = drop_pool.pop() || new Drop();
			drops.push(drop);
			drop.init(this.x);
		}
	}
}


// Droplet definition
function Drop() {
	this.x = 0;
	this.y = 0;
	this.radius = Math.round(Math.random() * 2 + 1) * demo.dpr;
	this.speed_x = 0;
	this.speed_y = 0;
	this.canvas = document.createElement('canvas');
	this.ctx = this.canvas.getContext('2d');
	
	// render once and cache
	var diameter = this.radius * 2;
	this.canvas.width = diameter;
	this.canvas.height = diameter;

	var grd = this.ctx.createRadialGradient(this.radius, this.radius , 1, this.radius, this.radius, this.radius);
	grd.addColorStop(0, demo.rain_color);
	grd.addColorStop(1, demo.rain_color_clear);
	this.ctx.fillStyle = grd;
	this.ctx.fillRect(0, 0, diameter, diameter);
}

Drop.max_speed = 5;

Drop.prototype.init = function(x) {
	this.x = x;
	this.y = demo.height;
	var angle = Math.random() * Math.PI - (Math.PI * 0.5);
	var speed = Math.random() * Drop.max_speed;
	this.speed_x = Math.sin(angle) * speed;
	this.speed_y = -Math.cos(angle) * speed;
}
Drop.prototype.recycle = function() {
	demo.drop_pool.push(this);
}




// handle interaction
demo.mouseHandler = function(evt) {
	demo.updateCursor(evt.clientX, evt.clientY);
}
demo.touchHandler = function(evt) {
	evt.preventDefault();
	var touch = evt.touches[0];
	demo.updateCursor(touch.clientX, touch.clientY);
}
demo.updateCursor = function(x, y) {
	x /= demo.width;
	y /= demo.height;
	var y_inverse = (1 - y);
	
	demo.drop_delay = y_inverse*y_inverse*y_inverse * 100 + 2;
	demo.wind = (x - 0.5) * 50;
}

document.addEventListener('mousemove', demo.mouseHandler);
document.addEventListener('touchstart', demo.touchHandler);
document.addEventListener('touchmove', demo.touchHandler);



// Frame ticker helper module
var Ticker = (function(){
	var PUBLIC_API = {};

	// public
	// will call function reference repeatedly once registered, passing elapsed time and a lag multiplier as parameters
	PUBLIC_API.addListener = function addListener(fn) {
		if (typeof fn !== 'function') throw('Ticker.addListener() requires a function reference passed in.');

		listeners.push(fn);

		// start frame-loop lazily
		if (!started) {
			started = true;
			queueFrame();
		}
	};

	// private
	var started = false;
	var last_timestamp = 0;
	var listeners = [];
	// queue up a new frame (calls frameHandler)
	function queueFrame() {
		if (window.requestAnimationFrame) {
			requestAnimationFrame(frameHandler);
		} else {
			webkitRequestAnimationFrame(frameHandler);
		}
	}
	function frameHandler(timestamp) {
		var frame_time = timestamp - last_timestamp;
		last_timestamp = timestamp;
		// make sure negative time isn't reported (first frame can be whacky)
		if (frame_time < 0) {
			frame_time = 17;
		}
		// - cap minimum framerate to 15fps[~68ms] (assuming 60fps[~17ms] as 'normal')
		else if (frame_time > 68) {
			frame_time = 68;
		}

		// fire custom listeners
		for (var i = 0, len = listeners.length; i < len; i++) {
			listeners[i].call(window, frame_time, frame_time / 16.67);
		}
		
		// always queue another frame
		queueFrame();
	}

	return PUBLIC_API;
}());