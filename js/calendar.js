// Input: 
// [{start:30, end:150}, {start:540, end:600}, {start:560, end:620}, {start:610, end:670}]

// Calendar object, we can wrap this in another closure if we actually want to include multiple
// calendars in the page
(function($) {

    // initialize slot with a value
    var EMPTYSLOT = [];
    var EVENT_CLASS = 'event';

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
            collisionSize: 0, // determines event width
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

    function updateCollidedEvnts(timeslotIndex, newEvnt) {
        var slot = this.timeslots[timeslotIndex];
        var bucketSize = slot.length;

        for (var i = 0; i < bucketSize; i++) {
            var oldEvnt = this.Evnts[slot[i]];
            oldEvnt.collisionSize = bucketSize + 1; // + new event
            debugger
            if (newEvnt.start > oldEvnt.start) {
                newEvnt.collisionPosition = slot.length;
            }
            else {
                newEvnt.collisionPosition = oldEvnt.collisionPosition;
                oldEvnt.collisionPosition = oldEvnt.collisionPosition + 1;
                debugger
            }
        }

        // update new evnt as well
        newEvnt.collisionSize = slot.length + 1;
    }

    // Calendar "class"

    // newEvnt: parsed event, should have id, start, end
    Calendar.prototype.addEvnt = function(newEvnt) {

        // store the event first
        this.Evnts[newEvnt.id] = newEvnt;

        var timeslots = this.timeslots;
        // handle collsions
        for (var i = newEvnt.start; i < newEvnt.end; i++) {
            var hasCollision = timeslots[i].length;
            // collision happens, update all collided events.collisionSize
            if (hasCollision) {
                // update existing events with new collision
                updateCollidedEvnts.call(this, i, newEvnt);

                console.warn('Event ' + newEvnt.id + ' is overlapping with ' + timeslots[i].toString());
            }

            // append newEvnt to this timeslot bucket
            timeslots[i] = createNewBucket(timeslots[i], newEvnt);
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
                            (100/evntToRender.collisionSize);
            var top = evntToRender.start;
            var left = evntToRender.collisionPosition * width;
            console.log(left);
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
    var Evnts = [{start:30, end:150}, {start:540, end:600}, {start:560, end:620}, {start:610, end:670}];

    // if we wanted, we can create multiple instances of calendars if we wanted
    // for example, if we want to see other people's calendars overlayed on top of another
    // ie. Google Calendar
    var myCalendarFactory = new CalendarFactory();
    myCal = myCalendarFactory.createCalendar(Evnts);
});
