/*
 * Reactive Background
 */
if (!("ontouchstart" in window) && !exception) {
    console.info(headerImg);
    $(function () {

        polyFill();

        $("body").append("<canvas id='reactive-bg-canvas'></canvas>");

        var width,
            height,
            canvas,
            ctx,
            points,
            target,
            draw = true,
            intersections = [],
            $canvas = $("#reactive-bg-canvas");
        $canvas.css("z-index", -999);

        var options = {
            speedThreshold: 50,
            lineLen: 30,
            heartBeatRange: 300,
            rgb: function (circlePos, heartBeatCenter) {
                var px = circlePos.x; // a point on boom circle
                var py = circlePos.y;
                var hbcx = heartBeatCenter.x;
                var hbcy = heartBeatCenter.y;

                var dis = Math.pow((px - hbcx), 2) + Math.pow((py - hbcy), 2);
                var maxDis = 300 * 300;

                var r = parseInt(255 * dis / maxDis);
                // do some computation....
                return {r: r, g: 217, b: 203};
            }
        };

        $(document).mouseenter(function () {
            draw = true;
        });

        $(document).mouseleave(function () {
            draw = false;
        });

        // Main
        initMap();
        initAnimation();
        addListeners();

        function initMap() {

            canvas = document.getElementById("reactive-bg-canvas");

            width = $(window).width();
            height = $(window).height();
            canvas.style.position = "fixed";
            canvas.style.top = '0px';
            canvas.style.left = '0px';

            canvas.width = width;
            canvas.height = height;

            target = {x: width / 2, y: height / 2, rx: width / 2, ry: height / 2};

            ctx = canvas.getContext("2d");

            createMap();

        }

        // Event handling
        function addListeners() {
            if (!("ontouchstart" in window)) {
                window.addEventListener("mousemove", mouseMove);
            }
            window.addEventListener("scroll", scroll);
            window.addEventListener("resize", resize);
        }

        function scroll() {
            var py = target.y;
            target.x = target.rx + document.body.scrollLeft + document.documentElement.scrollLeft;
            target.y = target.ry + document.body.scrollTop + document.documentElement.scrollTop;
            target.speed = Math.abs(py - target.y);
            if (target.animate) target.animate();
        }

        function mouseMove(e) {

            if (e.pageX || e.pageY) {
                target.x = e.pageX;
                target.y = e.pageY;
            }
            else if (e.clientX || e.clientY) {
                target.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                target.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }
            target.rx = e.clientX;
            target.ry = e.clientY;
        }


        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            initMap();
        }

        // animation
        function initAnimation() {

            target.animate = function () {
                if (this.speed > options.speedThreshold && !this.pass) {
                    this.pass = true;
                } else if (this.speed == 1 && this.pass) {
                    this.pass = false;
                    if (!intersections.length) heartBeat();
                }
            }
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            var count = 0;
            for (var i = 0; i < intersections.length; i++) {
                var intersection = intersections[i];
                if (intersection.circle.active > 0) {
                    intersection.circle.active -= 0.012;
                    intersection.circle.draw();
                } else count++;
            }
            if (intersections.length > 0 && count == intersections.length) {
                intersections = [];
                return;
            }
            requestAnimationFrame(animate);
        }

        function heartBeat() {
            animate();
            var clsP = findClosest();
            var srcCircle = new Circle(clsP, 0);
            var activeTime = 3000 * 0.8;
            var _frames = activeTime * 60 / 1000;
            var step = options.heartBeatRange / _frames;
            var sleep = activeTime / _frames;
            var originOpacity = 0.8;
            var centerP = getRelativeP();

            var f = function () {
                if (srcCircle.radius < options.heartBeatRange) {
                    for (var i = 0; i < points.length; i++) {
                        var curP = points[i];
                        if (getDistance(curP, srcCircle.pos) < Math.pow(srcCircle.radius, 2)) {
                            for (var j = 0; j < curP.closest.length; j++) {
                                var clsP = curP.closest[j];
                                var intersection = getIntersection(curP, clsP, srcCircle);
                                if (intersection != undefined) {
                                    intersection.circle = new Circle(intersection, 1.2, centerP);
                                    intersection.circle.active = originOpacity;
                                    originOpacity *= 0.999;
                                    intersections.push(intersection);
                                }
                            }
                        }
                    }
                    setTimeout(f, sleep);
                    srcCircle.radius += step;
                }
            };
            if (draw) f();
        }

        function createMap() {

            var source = {x: width / 2, y: height / 2, closest: []};
            var pointsQueue = [
                getNeighborPoint(source, "left"),
                getNeighborPoint(source, "rightTop"),
                getNeighborPoint(source, "rightBottom")
            ];

            // create points
            points = [source];

            for (; pointsQueue.length > 0;) {

                var p = pointsQueue.pop();
                if (0 < p.x && p.x < width && 0 < p.y && p.y < height) {
                    var same = false;
                    for (var i = 0; i < points.length; i++) {
                        var savedP = points[i];
                        var distance = getDistance(p, savedP);

                        if (distance < Math.pow(options.lineLen, 2) * 0.1) {
                            same = true;
                            break;
                        }
                    }
                    if (!same) {
                        points.push(p);
                        var type = p.type;
                        if (type == "leftTop" || type == "leftBottom") {
                            pointsQueue.unshift(getNeighborPoint(p, "left"));
                            pointsQueue.unshift(getNeighborPoint(p, type == "leftTop" ? "rightTop" : "rightBottom"));
                        } else if (type == "rightTop" || type == "rightBottom") {
                            pointsQueue.unshift(getNeighborPoint(p, "right"));
                            pointsQueue.unshift(getNeighborPoint(p, type == "rightTop" ? "leftTop" : "leftBottom"));
                        } else if (type == "left") {
                            pointsQueue.unshift(getNeighborPoint(p, "leftBottom"));
                            pointsQueue.unshift(getNeighborPoint(p, "leftTop"));
                        } else if (type == "right") {
                            pointsQueue.unshift(getNeighborPoint(p, "rightBottom"));
                            pointsQueue.unshift(getNeighborPoint(p, "rightTop"));
                        }
                    }
                }
            }

            // assign a circle to each point
            for (var i = 0; i < points.length; i++) {
                points[i].circle = new Circle(points[i], 2);
            }

        }

        function getNeighborPoint(p, type) {
            var deltaY = options.lineLen * Math.sin(60 * Math.PI / 180);
            var deltaX = options.lineLen * Math.cos(60 * Math.PI / 180);
            var res = {closest: []};

            if (type == "left" || type == "right") {
                res.x = p.x + options.lineLen * (type == "left" ? -1 : 1);
                res.y = p.y;
            } else if (type == "rightTop" || type == "rightBottom") {
                res.x = p.x + deltaX;
                res.y = p.y + deltaY * (type == "rightTop" ? -1 : 1)
            } else if (type == "leftTop" || type == "leftBottom") {
                res.x = p.x - deltaX;
                res.y = p.y + deltaY * (type == "leftTop" ? -1 : 1)
            }
            res.type = type;
            p.closest.push(res);
            res.closest.push(p);
            return res;
        }


        // equation
        function getIntersection(p1, p2, circle) {
            var d1 = getDistance(p1, circle.pos);
            var d2 = getDistance(p2, circle.pos);
            var maxDis = Math.sqrt(Math.max(d1, d2));
            var minDis = Math.sqrt(Math.min(d1, d2));
            if (minDis < circle.radius && maxDis > circle.radius) {
                var k = (p1.y - p2.y) / (p1.x - p2.x);
                var b = p1.y - k * p1.x;
                var c = -circle.pos.x;
                var d = -circle.pos.y;
                var r = circle.radius;

                var delta = (Math.pow(k, 2) + 1) * Math.pow(r, 2) - Math.pow(c * k, 2) + 2 * (c * d + b * c) * k - Math.pow(d + b, 2);
                var candidateX1 = (-1 * Math.sqrt(delta) - k * (d + b) - c) / (Math.pow(k, 2) + 1);
                var candidateX2 = (Math.sqrt(delta) - k * (d + b) - c) / (Math.pow(k, 2) + 1);

                var candidateX = (candidateX1 < Math.max(p1.x, p2.x) && candidateX1 > Math.min(p1.x, p2.x))
                    ? candidateX1 : candidateX2;
                var candidateY = k * candidateX + b;
                return {x: candidateX, y: candidateY};
            }

            return undefined;
        }

        function findClosest() {
            var closestP = {x: -100, y: -100};
            var rp = getRelativeP();
            for (var i = 0; i < points.length; i++) {
                var curP = points[i];
                closestP = getDistance(rp, curP) < getDistance(rp, closestP) ?
                    curP : closestP;
            }
            return closestP;
        }

        function getRelativeP() {
            var x = target.x - $canvas.offset().left;
            var y = target.y - $canvas.offset().top;
            return {x: x, y: y}
        }

        function polyFill() {
            var lastTime = 0;
            var vendors = ['ms', 'moz', 'webkit', 'o'];
            for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
                window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
                window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
            }
            if (!window.requestAnimationFrame) window.requestAnimationFrame = function (callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function () {
                    callback(currTime + timeToCall);
                }, timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };
            if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
        }


        function Circle(pos, rad, centerP) {

            this.pos = pos || null;
            this.radius = rad || null;
            this.centerP = centerP;

            this.draw = function () {
                if (!this.active) return;
                ctx.beginPath();
                ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
                var rgbRes = typeof options.rgb == "function" ? options.rgb(this.pos, this.centerP || this.pos) : options.rgb;
                rgbRes = "".concat(rgbRes.r).concat(",").concat(rgbRes.g).concat(",").concat(rgbRes.b);
                ctx.fillStyle = "rgba(" + rgbRes + "," + this.active + ")";
                ctx.fill();
            };

        }

        function getDistance(p1, p2) {
            return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
        }

    });
}

/* Animation */

$(function () {

    var onload = function () {
        // just in case visit could see nothing due to the Animation is not available

        var body = $('body');
        body.removeAttr("id"); // id = "body-hidden"
        var introHeader = $(".intro-header");
        if (introHeader.css("background-image") == "none") {
            introHeader.css("background-image", "url(" + headerImg + ")");
        }
        if (!debug) remote_serve();
    };

    if (exception) {onload();} else {
        window.onload = onload;
        var body = $('body');
        body.addClass("animsition");
        $("a:not('#night-mode'):not([href^='#'])").addClass("animsition-link");

        body.on("animsition.inStart", function () {
            window.console.info("animsition inStart");
            $(".intro-header").css("background-image", "url(" + headerImg + ")");
            body.removeAttr("id");
        });

        $(".animsition").animsition({
            inClass: 'fade-in-up',
            outClass: 'fade-out-down',
            inDuration: 300,
            outDuration: 300,
            linkElement: '.animsition-link',
            loading: true,
            loadingClass: 'animsition-loading',
            timeout: false,
            timeoutCountdown: 5000,
            onLoadEvent: true,
            browser: ['animation-duration', '-webkit-animation-duration', '-o-animation-duration'],
            overlay: false,
            overlayClass: 'animsition-overlay-slide',
            overlayParentElement: 'body',
            transition: function (url) {
                window.location.href = url;
            }
        });

    }
});


/*
 * add line under every article title
 */
$(function () {
    $("h2:not(.subheading):not(.post-title)").each(function () {
        $(this).append("<hr/>");
    })
});

/* Night Mode */
$(function () {

    var cookie_opt = function (key, value, options) {

        // value can be a function

        function read(s, converter) {
            var value = decodeURIComponent(s);
            decodeURIComponent(s);
            return $.isFunction(converter) ? converter(value) : value;
        }

        // Write

        if (value !== undefined && !$.isFunction(value)) {
            options = $.extend({}, options);

            var millisecScale = 864e+5; // day to millisec

            if (typeof options.expires === 'number') {
                var days = options.expires, t = options.expires = new Date();
                t.setTime(+t + days * millisecScale);
            }
            return (document.cookie = [
                encodeURIComponent(key), '=', encodeURIComponent(String(value)),
                options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
                options.path ? '; path=' + options.path : '',
                options.domain ? '; domain=' + options.domain : '',
                options.secure ? '; secure' : ''
            ].join(''));
        }

        // Read

        var result = "";

        var cookies = document.cookie ? document.cookie.split('; ') : [];


        for (var i = 0, l = cookies.length; i < l; i++) {
            var parts = cookies[i].split('=');
            var name = decodeURIComponent(parts.shift());
            var cookie = parts.join('=');
            if (key && key === name) {
                // If second argument (value) is a function it's a converter...
                result = read(cookie, value);
                break;
            }
        }
        return result;
    };


    var loadMode = function (mode, text) {
        theme.attr('href', cssPath + mode);
        button.text(text);
        if (window.navigator.cookieEnabled) {
            cookie_opt('mode', mode, {expires: 100, path: "/"});
            cookie_opt('text', text, {expires: 100, path: "/"});
        } else console.info('cookie is not available')
    };

    var button = $('#night-mode');
    var theme = $('#theme');

    theme.mode = 'daily-mode.min.css';
    button.btnText = 'Night Mode';

    if (window.navigator.cookieEnabled) {
        var localMode = cookie_opt('mode');
        var localText = cookie_opt('text');
        if (localMode && localText) {
            theme.mode = localMode;
            button.btnText = localText;
        }
    }
    loadMode(theme.mode, button.btnText);

    button.css('color', 'rgb(24, 149, 255)');
    button.hover(function () {
        button.css('cursor', 'pointer');
        button.css('color', 'rgb(24, 149, 155)');
    }, function () {
        button.css('color', 'rgb(24, 149, 255)');
    });

    var opposite = {
        'night-mode.min.css': 'daily-mode.min.css',
        'daily-mode.min.css': 'night-mode.min.css',
        'Night Mode': 'Daily Mode',
        'Daily Mode': 'Night Mode'
    };

    button.click(function () {
        theme.toggle(0, function () {
            theme.mode = opposite[theme.mode];
            button.btnText = opposite[button.btnText];
            loadMode(theme.mode, button.btnText);
        })
    })
});