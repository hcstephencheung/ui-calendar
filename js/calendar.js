// Input: 
// [{start:30, end:150}, {start:540, end:600}, {start:560, end:620}, {start:610, end:670}]

// Calendar object, we can wrap this in another closure if we actually want to include multiple
// calendars in the page
(function($) {

    // initialize slot with a value
    var EMPTYSLOT = [];
    var EVENT_CLASS = 'event';
    var MAX_TIMESLOT_COLUMNS = 10;

    // just assumes jQuery is ready
    if ($ === undefined) {
        console.log('Please include jQuery');
        return;
    }

    // helper functions
    var uniqueID = (function() {
        var uuid = 0;
        return function() {
            return uuid++;
        };
    }());

    function parseEvnt(rawEvent) {
        if( typeof rawEvent === 'undefined' || typeof rawEvent.start !== 'number' ) {
            console.error('Invalid event added. Calendar not constructed');
            return;
        }


        // default values for our evnts in calendar
        var Evnt = {
            id: uniqueID(),
            start: rawEvent.start,
            end: rawEvent.end,
            collisionSize: 1, // determines event width
            collisionPosition: null, // determines left position
            // info: {},
            // isAllDay: false;
        }

        return Evnt;
    }

    function createNewBucket(oldBucket, newEvnt) {
        var newBucket = [];
        var oldBucketSize = oldBucket.length;
        for (var i = 0; i < oldBucketSize; i++) {
            newBucket.push(oldBucket[i]);
        }
        newBucket.push(newEvnt.id);

        return newBucket;
    }

    function updateCollidedEvnts(timeIndex, newEvnt) {
        var slot = this.timeslots[timeIndex];
        var bucketSize = slot.length;
        var smallestPossible = 0;
        // [TODO] : basically, if the timeslot doesn't actually fit at all
        //          we should default to a new column, given column < max
        var largestPossible = MAX_TIMESLOT_COLUMNS;
        // compare, for every event newEvnt collides with
        // newEvnt.collisionPosition = first event that it doesn't collide with
        for (var i = 0; i < bucketSize; i++) {
            var collidingEvnt = this.Evnts[slot[i]];

            if (collidingEvnt.id === newEvnt.id) {
                continue;
            }

            // first ever collision
            if (collidingEvnt.collisionPosition === null) {
                collidingEvnt.collisionPosition = 0;
            }
            
            if (collidingEvnt.collisionPosition === smallestPossible) {
                smallestPossible++;
            }
            else if (collidingEvnt.collisionPosition < smallestPossible) {

            }
            else if (collidingEvnt.collisionPosition > smallestPossible) {
                smallestPossible = collidingEvnt.collisionPosition - 1;
            }
            
            newEvnt.collisionPosition = smallestPossible;
            collidingEvnt.collisionSize = (collidingEvnt.collisionSize > bucketSize) ? collidingEvnt.collisionSize : bucketSize; // + new event
            newEvnt.collisionSize = collidingEvnt.collisionSize;

            console.warn('Event ' + newEvnt.id + ' is overlapping with ' + collidingEvnt.id);
            console.log('bucket size: ' + bucketSize);
        }
    }

    // Calendar "class"

    // newEvnt: parsed event, should have id, start, end
    Calendar.prototype.addEvnt = function(newEvnt) {

        // store the event first
        this.Evnts[newEvnt.id] = newEvnt;

        var timeslots = this.timeslots;
        // handle collsions
        for (var i = newEvnt.start; i < newEvnt.end; i++) {
            // append newEvnt to this timeslot bucket
            timeslots[i] = createNewBucket(timeslots[i], newEvnt);

            var hasCollision = timeslots[newEvnt.start].length;
            // collision happens, update all collided events.collisionSize
            if (hasCollision) {
                // update existing events with new collision
                updateCollidedEvnts.call(this, i, newEvnt);
            }
        }

        
    }

    Calendar.prototype.render = function() {
        // basically just take the Evnts[]
        // height = time difference
        // width = W, which accounts for collision already
        // top = start coordinates
        // left = W
        // position is absolute
        for (var i in this.Evnts) {
            console.log(this.Evnts[i]);
            var evntToRender = this.Evnts[i];

            var height = evntToRender.end - evntToRender.start;
            var width = (evntToRender.collisionSize === 0) ?
                            100 :
                            Math.floor(100/evntToRender.collisionSize);
            var top = evntToRender.start;
            var left = evntToRender.collisionPosition * width;

            var eventDiv = $('<div/>');
            eventDiv.addClass(EVENT_CLASS);

            // CSS values
            eventDiv.css({
                'height': height,
                'width': width + '%',
                'top': top,
                'left': left + '%'
            });

            $('.calendar').append(eventDiv);
        }
    }

    // maybe we can change the format here
    Calendar.prototype.createTimeslots = function(format) {
        // default format = minutes
        var maxSlots;
        switch(format) {
            default:
                maxSlots = 24*60;
                break;
        }

        for (var i = 0; i < maxSlots; i++) {
            this.timeslots.push(EMPTYSLOT);
        }
    }

    // Constructor pattern because we want a Calendar "class"
    function Calendar(arguments) {
        // store all the events present in the calendar
        this.Evnts = [];
        // store list of event ids in here to handle collisions
        this.timeslots = [];
        this.createTimeslots('minutes');

        var evntLength = arguments.length;

        for(var i = 0; i < evntLength; i++) {
            // first we parse the argument into Evnt objects
            // refer to parseEvnt function
            this.addEvnt(parseEvnt(arguments[i]));
        }
        this.render();
    }


    // CalendarFactory
    // Opted to use a factory pattern to create the calendar, in case we want to create multiple
    // calendar instances in the future
    this.CalendarFactory = function() {};
    this.CalendarFactory.prototype.Calendar = Calendar;
    this.CalendarFactory.prototype.createCalendar = function(arguments) {
        return new this.Calendar(arguments);
    }
    

}(jQuery || window.$));

$(document).ready(function() {
    // initialize the calendar with the given Evnts
    // var Evnts = [{start:30, end:150}, {start:540, end:600}, {start:560, end:620}, {start:610, end:670}, {start: 600, end: 700}];
    var Evnts = [{start:30, end:150}, {start:540, end:600}, {start:560, end:620}, {start:610, end:670}];

    // if we wanted, we can create multiple instances of calendars if we wanted
    // for example, if we want to see other people's calendars overlayed on top of another
    // ie. Google Calendar
    var myCalendarFactory = new CalendarFactory();
    myCal = myCalendarFactory.createCalendar(Evnts);
});
