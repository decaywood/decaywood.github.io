/*
 * Reactive Background
 */
if (window.requestAnimationFrame && window.cancelAnimationFrame) {

    $(function () {

        var width, height, canvas, ctx, points, target;

        // Main
        initHeader();
        initAnimation();
        addListeners();

        function initHeader() {

            canvas = document.getElementById("reactive-bg-canvas");
            canvas.width = $(document).width();
            canvas.height = $(window).height();
            canvas.style.position = "fixed";
            width = canvas.width;
            height = canvas.height;
            target = {x: width / 2, y: height / 2};

            ctx = canvas.getContext("2d");

            // create points
            points = [];
            for (var x = 0; x < width; x = x + width / 20) {
                for (var y = 0; y < height; y = y + height / 20) {
                    var px = x + Math.random() * width / 20;
                    var py = y + Math.random() * height / 20;
                    var p = {x: px, originX: px, y: py, originY: py};
                    points.push(p);
                }
            }

            // for each point find the 5 closest points
            for (var i = 0; i < points.length; i++) {
                var closest = [];
                var p1 = points[i];
                for (var j = 0; j < points.length; j++) {
                    var p2 = points[j];
                    if (!(p1 == p2)) {
                        var placed = false;
                        for (var k = 0; k < 5; k++) {
                            if (!placed) {
                                if (closest[k] == undefined) {
                                    closest[k] = p2;
                                    placed = true;
                                }
                            }
                        }

                        for (var k = 0; k < 5; k++) {
                            if (!placed) {
                                if (getDistance(p1, p2) < getDistance(p1, closest[k])) {
                                    closest[k] = p2;
                                    placed = true;
                                }
                            }
                        }
                    }
                }
                p1.closest = closest;
            }

            // assign a circle to each point
            for (var i = 0; i < points.length; i++) {
                points[i].circle = new Circle(points[i], 2 + Math.random() * 2, "rgba(255,255,255,0.3)");
            }
        }

        // Event handling
        function addListeners() {
            if (!("ontouchstart" in window)) {
                window.addEventListener("mousemove", mouseMove);
            }
            window.addEventListener("resize", resize);
        }

        function mouseMove(e) {
            target.x = e.clientX;
            target.y = e.clientY;
        }


        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        }

        // animation
        function initAnimation() {
            animate();
            for (var i = 0; i < points.length; i++) {
                shiftPoint(points[i]);
            }
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            for (var i = 0; i < points.length; i++) {
                // detect points in range
                if (Math.abs(getDistance(target, points[i])) < 4000) {
                    points[i].active = 0.3;
                    points[i].circle.active = 0.6;
                } else if (Math.abs(getDistance(target, points[i])) < 20000) {
                    points[i].active = 0.1;
                    points[i].circle.active = 0.3;
                } else if (Math.abs(getDistance(target, points[i])) < 40000) {
                    points[i].active = 0.02;
                    points[i].circle.active = 0.1;
                } else {
                    points[i].active = 0;
                    points[i].circle.active = 0;
                }
                drawLines(points[i]);
                points[i].circle.draw();
            }
            requestAnimationFrame(animate);
        }

        function shiftPoint(p) {
            TweenLite.to(p, 1 + Math.random(), {
                x: p.originX - 50 + Math.random() * 100,
                y: p.originY - 50 + Math.random() * 100,
                onComplete: function () {
                    shiftPoint(p);
                }
            });
        }

        // Canvas manipulation
        function drawLines(p) {
            if (!p.active) return;
            for (var i = 0; i < p.closest.length; i++) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.closest[i].x, p.closest[i].y);
                ctx.strokeStyle = "rgba(156,217,249," + p.active + ")";
                ctx.stroke();
            }
        }

        function Circle(pos, rad, color) {
            var _this = this;

            // constructor
            (function () {
                _this.pos = pos || null;
                _this.radius = rad || null;
                _this.color = color || null;
            })();

            this.draw = function () {
                if (!_this.active) return;
                ctx.beginPath();
                ctx.arc(_this.pos.x, _this.pos.y, _this.radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = "rgba(156,217,249," + _this.active + ")";
                ctx.fill();
            };
        }

        // Util
        function getDistance(p1, p2) {
            return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
        }

    });
}

/* Animation */
$(function () {

    window.onload = function () {
        // just in case visit could see nothing due to the Animation is not available
        window.console.info("window loaded");
        var body = $('body');
        body.removeAttr("id"); // id = "body-hidden"
        var introHeader = $(".intro-header");
        if (introHeader.css("background-image") == "none") {
            introHeader.css("background-image", "url(" + headerImg + ")");
        }

    };

    var body = $('body');

    body.addClass("animsition");
    $("a:not(#night-mode):not([href^=#])").addClass("animsition-link");

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
            decodeURIComponent(s)
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
            cookie_opt('mode', mode, {expires: 100});
            cookie_opt('text', text, {expires: 100});
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