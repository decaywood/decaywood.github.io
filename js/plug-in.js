/*!
 * scrollup v2.4.0
 * Url: http://markgoodyear.com/labs/scrollup/
 * Copyright (c) Mark Goodyear — @markgdyr — http://markgoodyear.com
 * License: MIT
 */
(function ($, window, document) {
    'use strict';

    // Main function
    $.fn.scrollUp = function (options) {

        // Ensure that only one scrollUp exists
        if (!$.data(document.body, 'scrollUp')) {
            $.data(document.body, 'scrollUp', true);
            $.fn.scrollUp.init(options);
        }
    };

    // Init
    $.fn.scrollUp.init = function (options) {

        // Define vars
        var o = $.fn.scrollUp.settings = $.extend({}, $.fn.scrollUp.defaults, options),
            triggerVisible = false,
            animIn, animOut, animSpeed, scrollDis, scrollEvent, scrollTarget, $self;

        // Create element
        if (o.scrollTrigger) {
            $self = $(o.scrollTrigger);
        } else {
            $self = $('<a/>', {
                id: o.scrollName,
                href: '#top'
            });
        }

        // Set scrollTitle if there is one
        if (o.scrollTitle) {
            $self.attr('title', o.scrollTitle);
        }

        $self.appendTo('body');

        // If not using an image display text
        if (!(o.scrollImg || o.scrollTrigger)) {
            $self.html(o.scrollText);
        }

        // Minimum CSS to make the magic happen
        $self.css({
            display: 'none',
            position: 'fixed',
            zIndex: o.zIndex
        });

        // Active point overlay
        if (o.activeOverlay) {
            $('<div/>', {
                id: o.scrollName + '-active'
            }).css({
                position: 'absolute',
                'top': o.scrollDistance + 'px',
                width: '100%',
                borderTop: '1px dotted' + o.activeOverlay,
                zIndex: o.zIndex
            }).appendTo('body');
        }

        // Switch animation type
        switch (o.animation) {
            case 'fade':
                animIn = 'fadeIn';
                animOut = 'fadeOut';
                animSpeed = o.animationSpeed;
                break;

            case 'slide':
                animIn = 'slideDown';
                animOut = 'slideUp';
                animSpeed = o.animationSpeed;
                break;

            default:
                animIn = 'show';
                animOut = 'hide';
                animSpeed = 0;
        }

        // If from top or bottom
        if (o.scrollFrom === 'top') {
            scrollDis = o.scrollDistance;
        } else {
            scrollDis = $(document).height() - $(window).height() - o.scrollDistance;
        }

        // Scroll function
        scrollEvent = $(window).scroll(function () {
            if ($(window).scrollTop() > scrollDis) {
                if (!triggerVisible) {
                    $self[animIn](animSpeed);
                    triggerVisible = true;
                }
            } else {
                if (triggerVisible) {
                    $self[animOut](animSpeed);
                    triggerVisible = false;
                }
            }
        });

        if (o.scrollTarget) {
            if (typeof o.scrollTarget === 'number') {
                scrollTarget = o.scrollTarget;
            } else if (typeof o.scrollTarget === 'string') {
                scrollTarget = Math.floor($(o.scrollTarget).offset().top);
            }
        } else {
            scrollTarget = 0;
        }

        // To the top
        $self.click(function (e) {
            e.preventDefault();

            $('html, body').animate({
                scrollTop: scrollTarget
            }, o.scrollSpeed, o.easingType);
        });
    };

    // Defaults
    $.fn.scrollUp.defaults = {
        scrollName: 'scrollUp',      // Element ID
        scrollDistance: 300,         // Distance from top/bottom before showing element (px)
        scrollFrom: 'top',           // 'top' or 'bottom'
        scrollSpeed: 300,            // Speed back to top (ms)
        easingType: 'linear',        // Scroll to top easing (see http://easings.net/)
        animation: 'fade',           // Fade, slide, none
        animationSpeed: 200,         // Animation in speed (ms)
        scrollTrigger: false,        // Set a custom triggering element. Can be an HTML string or jQuery object
        scrollTarget: false,         // Set a custom target element for scrolling to. Can be element or number
        scrollText: 'Scroll to top', // Text for element, can contain HTML
        scrollTitle: false,          // Set a custom <a> title if required. Defaults to scrollText
        scrollImg: false,            // Set true to use image
        activeOverlay: false,        // Set CSS color to display scrollUp active point, e.g '#00FFFF'
        zIndex: 2147483647           // Z-Index for the overlay
    };

    // Destroy scrollUp plugin and clean all modifications to the DOM
    $.fn.scrollUp.destroy = function (scrollEvent) {
        $.removeData(document.body, 'scrollUp');
        $('#' + $.fn.scrollUp.settings.scrollName).remove();
        $('#' + $.fn.scrollUp.settings.scrollName + '-active').remove();

        // If 1.7 or above use the new .off()
        if ($.fn.jquery.split('.')[1] >= 7) {
            $(window).off('scroll', scrollEvent);

            // Else use the old .unbind()
        } else {
            $(window).unbind('scroll', scrollEvent);
        }
    };

    $.scrollUp = $.fn.scrollUp;

})(jQuery, window, document);


/*
 * vertical news ticker
 * Tadas Juozapaitis ( kasp3rito@gmail.com )
 * http://www.jugbit.com/jquery-vticker-vertical-news-ticker/
 * v 1.4
 */
(function ($) {
    $.fn.vTicker = function (options) {
        var defaults = {
            speed: 700,
            pause: 4000,
            showItems: 3,
            animation: '',
            mousePause: true,
            isPaused: false,
            direction: 'up',
            height: 0
        };

        var options = $.extend(defaults, options);

        moveUp = function (obj2, height, options) {
            if (options.isPaused)
                return;

            var obj = obj2.children('ul');

            var clone = obj.children('li:first').clone(true);

            if (options.height > 0) {
                height = obj.children('li:first').height();
            }

            obj.animate({top: '-=' + height + 'px'}, options.speed, function () {
                $(this).children('li:first').remove();
                $(this).css('top', '0px');
            });

            if (options.animation == 'fade') {
                obj.children('li:first').fadeOut(options.speed);
                if (options.height == 0) {
                    obj.children('li:eq(' + options.showItems + ')').hide().fadeIn(options.speed).show();
                }
            }

            clone.appendTo(obj);
        };

        moveDown = function (obj2, height, options) {
            if (options.isPaused)
                return;

            var obj = obj2.children('ul');

            var clone = obj.children('li:last').clone(true);

            if (options.height > 0) {
                height = obj.children('li:first').height();
            }

            obj.css('top', '-' + height + 'px')
                .prepend(clone);

            obj.animate({top: 0}, options.speed, function () {
                $(this).children('li:last').remove();
            });

            if (options.animation == 'fade') {
                if (options.height == 0) {
                    obj.children('li:eq(' + options.showItems + ')').fadeOut(options.speed);
                }
                obj.children('li:first').hide().fadeIn(options.speed).show();
            }
        };

        return this.each(function () {
            var obj = $(this);
            var maxHeight = 0;

            obj.css({overflow: 'hidden', position: 'relative'})
                .children('ul').css({position: 'absolute', margin: 0, padding: 0})
                .children('li').css({margin: 0, padding: 0});

            if (options.height == 0) {
                obj.children('ul').children('li').each(function () {
                    if ($(this).height() > maxHeight) {
                        maxHeight = $(this).height();
                    }
                });

                obj.children('ul').children('li').each(function () {
                    $(this).height(maxHeight);
                });

                obj.height(maxHeight * options.showItems);
            }
            else {
                obj.height(options.height);
            }

            var interval = setInterval(function () {
                if (options.direction == 'up') {
                    moveUp(obj, maxHeight, options);
                }
                else {
                    moveDown(obj, maxHeight, options);
                }
            }, options.pause);

            if (options.mousePause) {
                obj.bind("mouseenter", function () {
                    options.isPaused = true;
                }).bind("mouseleave", function () {
                    options.isPaused = false;
                });
            }
        });
    };
})(jQuery);


/*!
 Waypoints - 4.0.0
 Copyright © 2011-2015 Caleb Troughton
 Licensed under the MIT license.
 https://github.com/imakewebthings/waypoints/blob/master/licenses.txt
 */
(function () {
    'use strict'

    var keyCounter = 0
    var allWaypoints = {}

    /* http://imakewebthings.com/waypoints/api/waypoint */
    function Waypoint(options) {
        if (!options) {
            throw new Error('No options passed to Waypoint constructor')
        }
        if (!options.element) {
            throw new Error('No element option passed to Waypoint constructor')
        }
        if (!options.handler) {
            throw new Error('No handler option passed to Waypoint constructor')
        }

        this.key = 'waypoint-' + keyCounter
        this.options = Waypoint.Adapter.extend({}, Waypoint.defaults, options)
        this.element = this.options.element
        this.adapter = new Waypoint.Adapter(this.element)
        this.callback = options.handler
        this.axis = this.options.horizontal ? 'horizontal' : 'vertical'
        this.enabled = this.options.enabled
        this.triggerPoint = null
        this.group = Waypoint.Group.findOrCreate({
            name: this.options.group,
            axis: this.axis
        })
        this.context = Waypoint.Context.findOrCreateByElement(this.options.context)

        if (Waypoint.offsetAliases[this.options.offset]) {
            this.options.offset = Waypoint.offsetAliases[this.options.offset]
        }
        this.group.add(this)
        this.context.add(this)
        allWaypoints[this.key] = this
        keyCounter += 1
    }

    /* Private */
    Waypoint.prototype.queueTrigger = function (direction) {
        this.group.queueTrigger(this, direction)
    }

    /* Private */
    Waypoint.prototype.trigger = function (args) {
        if (!this.enabled) {
            return
        }
        if (this.callback) {
            this.callback.apply(this, args)
        }
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/destroy */
    Waypoint.prototype.destroy = function () {
        this.context.remove(this)
        this.group.remove(this)
        delete allWaypoints[this.key]
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/disable */
    Waypoint.prototype.disable = function () {
        this.enabled = false
        return this
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/enable */
    Waypoint.prototype.enable = function () {
        this.context.refresh()
        this.enabled = true
        return this
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/next */
    Waypoint.prototype.next = function () {
        return this.group.next(this)
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/previous */
    Waypoint.prototype.previous = function () {
        return this.group.previous(this)
    }

    /* Private */
    Waypoint.invokeAll = function (method) {
        var allWaypointsArray = []
        for (var waypointKey in allWaypoints) {
            allWaypointsArray.push(allWaypoints[waypointKey])
        }
        for (var i = 0, end = allWaypointsArray.length; i < end; i++) {
            allWaypointsArray[i][method]()
        }
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/destroy-all */
    Waypoint.destroyAll = function () {
        Waypoint.invokeAll('destroy')
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/disable-all */
    Waypoint.disableAll = function () {
        Waypoint.invokeAll('disable')
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/enable-all */
    Waypoint.enableAll = function () {
        Waypoint.invokeAll('enable')
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/refresh-all */
    Waypoint.refreshAll = function () {
        Waypoint.Context.refreshAll()
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/viewport-height */
    Waypoint.viewportHeight = function () {
        return window.innerHeight || document.documentElement.clientHeight
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/viewport-width */
    Waypoint.viewportWidth = function () {
        return document.documentElement.clientWidth
    }

    Waypoint.adapters = []

    Waypoint.defaults = {
        context: window,
        continuous: true,
        enabled: true,
        group: 'default',
        horizontal: false,
        offset: 0
    }

    Waypoint.offsetAliases = {
        'bottom-in-view': function () {
            return this.context.innerHeight() - this.adapter.outerHeight()
        },
        'right-in-view': function () {
            return this.context.innerWidth() - this.adapter.outerWidth()
        }
    }

    window.Waypoint = Waypoint
}())
;

(function () {
    'use strict'

    function requestAnimationFrameShim(callback) {
        window.setTimeout(callback, 1000 / 60)
    }

    var keyCounter = 0
    var contexts = {}
    var Waypoint = window.Waypoint
    var oldWindowLoad = window.onload

    /* http://imakewebthings.com/waypoints/api/context */
    function Context(element) {
        this.element = element
        this.Adapter = Waypoint.Adapter
        this.adapter = new this.Adapter(element)
        this.key = 'waypoint-context-' + keyCounter
        this.didScroll = false
        this.didResize = false
        this.oldScroll = {
            x: this.adapter.scrollLeft(),
            y: this.adapter.scrollTop()
        }
        this.waypoints = {
            vertical: {},
            horizontal: {}
        }

        element.waypointContextKey = this.key
        contexts[element.waypointContextKey] = this
        keyCounter += 1

        this.createThrottledScrollHandler()
        this.createThrottledResizeHandler()
    }

    /* Private */
    Context.prototype.add = function (waypoint) {
        var axis = waypoint.options.horizontal ? 'horizontal' : 'vertical'
        this.waypoints[axis][waypoint.key] = waypoint
        this.refresh()
    }

    /* Private */
    Context.prototype.checkEmpty = function () {
        var horizontalEmpty = this.Adapter.isEmptyObject(this.waypoints.horizontal)
        var verticalEmpty = this.Adapter.isEmptyObject(this.waypoints.vertical)
        if (horizontalEmpty && verticalEmpty) {
            this.adapter.off('.waypoints')
            delete contexts[this.key]
        }
    }

    /* Private */
    Context.prototype.createThrottledResizeHandler = function () {
        var self = this

        function resizeHandler() {
            self.handleResize()
            self.didResize = false
        }

        this.adapter.on('resize.waypoints', function () {
            if (!self.didResize) {
                self.didResize = true
                Waypoint.requestAnimationFrame(resizeHandler)
            }
        })
    }

    /* Private */
    Context.prototype.createThrottledScrollHandler = function () {
        var self = this

        function scrollHandler() {
            self.handleScroll()
            self.didScroll = false
        }

        this.adapter.on('scroll.waypoints', function () {
            if (!self.didScroll || Waypoint.isTouch) {
                self.didScroll = true
                Waypoint.requestAnimationFrame(scrollHandler)
            }
        })
    }

    /* Private */
    Context.prototype.handleResize = function () {
        Waypoint.Context.refreshAll()
    }

    /* Private */
    Context.prototype.handleScroll = function () {
        var triggeredGroups = {}
        var axes = {
            horizontal: {
                newScroll: this.adapter.scrollLeft(),
                oldScroll: this.oldScroll.x,
                forward: 'right',
                backward: 'left'
            },
            vertical: {
                newScroll: this.adapter.scrollTop(),
                oldScroll: this.oldScroll.y,
                forward: 'down',
                backward: 'up'
            }
        }

        for (var axisKey in axes) {
            var axis = axes[axisKey]
            var isForward = axis.newScroll > axis.oldScroll
            var direction = isForward ? axis.forward : axis.backward

            for (var waypointKey in this.waypoints[axisKey]) {
                var waypoint = this.waypoints[axisKey][waypointKey]
                var wasBeforeTriggerPoint = axis.oldScroll < waypoint.triggerPoint
                var nowAfterTriggerPoint = axis.newScroll >= waypoint.triggerPoint
                var crossedForward = wasBeforeTriggerPoint && nowAfterTriggerPoint
                var crossedBackward = !wasBeforeTriggerPoint && !nowAfterTriggerPoint
                if (crossedForward || crossedBackward) {
                    waypoint.queueTrigger(direction)
                    triggeredGroups[waypoint.group.id] = waypoint.group
                }
            }
        }

        for (var groupKey in triggeredGroups) {
            triggeredGroups[groupKey].flushTriggers()
        }

        this.oldScroll = {
            x: axes.horizontal.newScroll,
            y: axes.vertical.newScroll
        }
    }

    /* Private */
    Context.prototype.innerHeight = function () {
        /*eslint-disable eqeqeq */
        if (this.element == this.element.window) {
            return Waypoint.viewportHeight()
        }
        /*eslint-enable eqeqeq */
        return this.adapter.innerHeight()
    }

    /* Private */
    Context.prototype.remove = function (waypoint) {
        delete this.waypoints[waypoint.axis][waypoint.key]
        this.checkEmpty()
    }

    /* Private */
    Context.prototype.innerWidth = function () {
        /*eslint-disable eqeqeq */
        if (this.element == this.element.window) {
            return Waypoint.viewportWidth()
        }
        /*eslint-enable eqeqeq */
        return this.adapter.innerWidth()
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/context-destroy */
    Context.prototype.destroy = function () {
        var allWaypoints = []
        for (var axis in this.waypoints) {
            for (var waypointKey in this.waypoints[axis]) {
                allWaypoints.push(this.waypoints[axis][waypointKey])
            }
        }
        for (var i = 0, end = allWaypoints.length; i < end; i++) {
            allWaypoints[i].destroy()
        }
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/context-refresh */
    Context.prototype.refresh = function () {
        /*eslint-disable eqeqeq */
        var isWindow = this.element == this.element.window
        /*eslint-enable eqeqeq */
        var contextOffset = isWindow ? undefined : this.adapter.offset()
        var triggeredGroups = {}
        var axes

        this.handleScroll()
        axes = {
            horizontal: {
                contextOffset: isWindow ? 0 : contextOffset.left,
                contextScroll: isWindow ? 0 : this.oldScroll.x,
                contextDimension: this.innerWidth(),
                oldScroll: this.oldScroll.x,
                forward: 'right',
                backward: 'left',
                offsetProp: 'left'
            },
            vertical: {
                contextOffset: isWindow ? 0 : contextOffset.top,
                contextScroll: isWindow ? 0 : this.oldScroll.y,
                contextDimension: this.innerHeight(),
                oldScroll: this.oldScroll.y,
                forward: 'down',
                backward: 'up',
                offsetProp: 'top'
            }
        }

        for (var axisKey in axes) {
            var axis = axes[axisKey]
            for (var waypointKey in this.waypoints[axisKey]) {
                var waypoint = this.waypoints[axisKey][waypointKey]
                var adjustment = waypoint.options.offset
                var oldTriggerPoint = waypoint.triggerPoint
                var elementOffset = 0
                var freshWaypoint = oldTriggerPoint == null
                var contextModifier, wasBeforeScroll, nowAfterScroll
                var triggeredBackward, triggeredForward

                if (waypoint.element !== waypoint.element.window) {
                    elementOffset = waypoint.adapter.offset()[axis.offsetProp]
                }

                if (typeof adjustment === 'function') {
                    adjustment = adjustment.apply(waypoint)
                }
                else if (typeof adjustment === 'string') {
                    adjustment = parseFloat(adjustment)
                    if (waypoint.options.offset.indexOf('%') > -1) {
                        adjustment = Math.ceil(axis.contextDimension * adjustment / 100)
                    }
                }

                contextModifier = axis.contextScroll - axis.contextOffset
                waypoint.triggerPoint = elementOffset + contextModifier - adjustment
                wasBeforeScroll = oldTriggerPoint < axis.oldScroll
                nowAfterScroll = waypoint.triggerPoint >= axis.oldScroll
                triggeredBackward = wasBeforeScroll && nowAfterScroll
                triggeredForward = !wasBeforeScroll && !nowAfterScroll

                if (!freshWaypoint && triggeredBackward) {
                    waypoint.queueTrigger(axis.backward)
                    triggeredGroups[waypoint.group.id] = waypoint.group
                }
                else if (!freshWaypoint && triggeredForward) {
                    waypoint.queueTrigger(axis.forward)
                    triggeredGroups[waypoint.group.id] = waypoint.group
                }
                else if (freshWaypoint && axis.oldScroll >= waypoint.triggerPoint) {
                    waypoint.queueTrigger(axis.forward)
                    triggeredGroups[waypoint.group.id] = waypoint.group
                }
            }
        }

        Waypoint.requestAnimationFrame(function () {
            for (var groupKey in triggeredGroups) {
                triggeredGroups[groupKey].flushTriggers()
            }
        })

        return this
    }

    /* Private */
    Context.findOrCreateByElement = function (element) {
        return Context.findByElement(element) || new Context(element)
    }

    /* Private */
    Context.refreshAll = function () {
        for (var contextId in contexts) {
            contexts[contextId].refresh()
        }
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/context-find-by-element */
    Context.findByElement = function (element) {
        return contexts[element.waypointContextKey]
    }

    window.onload = function () {
        if (oldWindowLoad) {
            oldWindowLoad()
        }
        Context.refreshAll()
    }

    Waypoint.requestAnimationFrame = function (callback) {
        var requestFn = window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            requestAnimationFrameShim
        requestFn.call(window, callback)
    }
    Waypoint.Context = Context
}())
;
(function () {
    'use strict'

    function byTriggerPoint(a, b) {
        return a.triggerPoint - b.triggerPoint
    }

    function byReverseTriggerPoint(a, b) {
        return b.triggerPoint - a.triggerPoint
    }

    var groups = {
        vertical: {},
        horizontal: {}
    }
    var Waypoint = window.Waypoint

    /* http://imakewebthings.com/waypoints/api/group */
    function Group(options) {
        this.name = options.name
        this.axis = options.axis
        this.id = this.name + '-' + this.axis
        this.waypoints = []
        this.clearTriggerQueues()
        groups[this.axis][this.name] = this
    }

    /* Private */
    Group.prototype.add = function (waypoint) {
        this.waypoints.push(waypoint)
    }

    /* Private */
    Group.prototype.clearTriggerQueues = function () {
        this.triggerQueues = {
            up: [],
            down: [],
            left: [],
            right: []
        }
    }

    /* Private */
    Group.prototype.flushTriggers = function () {
        for (var direction in this.triggerQueues) {
            var waypoints = this.triggerQueues[direction]
            var reverse = direction === 'up' || direction === 'left'
            waypoints.sort(reverse ? byReverseTriggerPoint : byTriggerPoint)
            for (var i = 0, end = waypoints.length; i < end; i += 1) {
                var waypoint = waypoints[i]
                if (waypoint.options.continuous || i === waypoints.length - 1) {
                    waypoint.trigger([direction])
                }
            }
        }
        this.clearTriggerQueues()
    }

    /* Private */
    Group.prototype.next = function (waypoint) {
        this.waypoints.sort(byTriggerPoint)
        var index = Waypoint.Adapter.inArray(waypoint, this.waypoints)
        var isLast = index === this.waypoints.length - 1
        return isLast ? null : this.waypoints[index + 1]
    }

    /* Private */
    Group.prototype.previous = function (waypoint) {
        this.waypoints.sort(byTriggerPoint)
        var index = Waypoint.Adapter.inArray(waypoint, this.waypoints)
        return index ? this.waypoints[index - 1] : null
    }

    /* Private */
    Group.prototype.queueTrigger = function (waypoint, direction) {
        this.triggerQueues[direction].push(waypoint)
    }

    /* Private */
    Group.prototype.remove = function (waypoint) {
        var index = Waypoint.Adapter.inArray(waypoint, this.waypoints)
        if (index > -1) {
            this.waypoints.splice(index, 1)
        }
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/first */
    Group.prototype.first = function () {
        return this.waypoints[0]
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/last */
    Group.prototype.last = function () {
        return this.waypoints[this.waypoints.length - 1]
    }

    /* Private */
    Group.findOrCreate = function (options) {
        return groups[options.axis][options.name] || new Group(options)
    }

    Waypoint.Group = Group
}())
;
(function () {
    'use strict'

    var $ = window.jQuery
    var Waypoint = window.Waypoint

    function JQueryAdapter(element) {
        this.$element = $(element)
    }

    $.each([
        'innerHeight',
        'innerWidth',
        'off',
        'offset',
        'on',
        'outerHeight',
        'outerWidth',
        'scrollLeft',
        'scrollTop'
    ], function (i, method) {
        JQueryAdapter.prototype[method] = function () {
            var args = Array.prototype.slice.call(arguments)
            return this.$element[method].apply(this.$element, args)
        }
    })

    $.each([
        'extend',
        'inArray',
        'isEmptyObject'
    ], function (i, method) {
        JQueryAdapter[method] = $[method]
    })

    Waypoint.adapters.push({
        name: 'jquery',
        Adapter: JQueryAdapter
    })
    Waypoint.Adapter = JQueryAdapter
}())
;
(function () {
    'use strict'

    var Waypoint = window.Waypoint

    function createExtension(framework) {
        return function () {
            var waypoints = []
            var overrides = arguments[0]

            if (framework.isFunction(arguments[0])) {
                overrides = framework.extend({}, arguments[1])
                overrides.handler = arguments[0]
            }

            this.each(function () {
                var options = framework.extend({}, overrides, {
                    element: this
                })
                if (typeof options.context === 'string') {
                    options.context = framework(this).closest(options.context)[0]
                }
                waypoints.push(new Waypoint(options))
            })

            return waypoints
        }
    }

    if (window.jQuery) {
        window.jQuery.fn.waypoint = createExtension(window.jQuery)
    }
    if (window.Zepto) {
        window.Zepto.fn.waypoint = createExtension(window.Zepto)
    }
}())
;