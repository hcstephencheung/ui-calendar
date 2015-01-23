// Input: 
// [{start:30, end:150}, {start:540, end:600}, {start:560, end:620}, {start:610, end:670}]

// Calendar object, we can wrap this in another closure if we actually want to include multiple
// calendars in the page
(function($) {

    // initialize slot with a value
    var EMPTYSLOT = null;
    var EVENT_CLASS = 'event';
    var MAX_TIMESLOT_COLUMNS = 6;

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
            collisions: 0, // helps determine event width
            rowSize: MAX_TIMESLOT_COLUMNS, // determines event width
            anchorPoint: null, // determines left position
            // info: {}
        }

        return Evnt;
    }

    // from start time, return the first free column
    // returns null if no free columns
    function checkForFreeSpace(evnt) {
        var freeColumn = null;

        for (var i = 0; i < MAX_TIMESLOT_COLUMNS; i++) {
            // slot taken
            if (this.timeTable[evnt.start][i] === null) {
                freeColumn = i;
                break;
            }
        }

        return freeColumn;
    }

    // returns the array of IDs that this evnt is colliding with
    function canItFit(column, evnt) {
        var collidingEvnts = [];

        for (var i = evnt.start; i < evnt.end; i++) {
            for (var j = 0; j < MAX_TIMESLOT_COLUMNS; j++) {
                if (this.timeTable[i][j] !== null) {
                    var id = this.timeTable[i][j];
                    collidingEvnts[id] = 'filled';
                    break;
                }
            }
        }

        return collidingEvnts;
    }

    // TODO problem is in here
    function _shrinkEvntInTable(collidingEvnts) {
        for (var collidingEvnt in collidingEvnts) {
            var id = parseInt(collidingEvnt);
            var evnt = this.Evnts[id];
            var shrinkSize = MAX_TIMESLOT_COLUMNS / (evnt.collisions + 1); // 0 based

            // update rowSize now that we're safe to add
            evnt.rowSize = shrinkSize;
            for (var i = evnt.start; i < evnt.end; i++) {
                // bug here: when shrinking, we need to load the old values too
                var row = [];
                var shrinkCounter = 0;

                for (var j = 0; j < MAX_TIMESLOT_COLUMNS; j++) {
                    if (this.timeTable[i][j] !== id) {
                        row.push(this.timeTable[i][j]);
                    }
                    else {
                        if (shrinkCounter < shrinkSize) {
                            row.push(evnt.id);
                            shrinkCounter++;
                        }
                        else {
                            row.push(EMPTYSLOT);
                        }
                    }
                }
                this.timeTable[i] = row;
            }
        }
    }

    // bump collision counter for other events
    function shrinkEvnts(collidingEvnts) {
        var maxCollisions = 0;
        for (var collidingEvnt in collidingEvnts) {
            var id = parseInt(collidingEvnt);
            this.Evnts[id].collisions++;

            maxCollisions = 
                (this.Evnts[id].collisions > maxCollisions) ?
                this.Evnts[id].collisions :
                maxCollisions;

            if (this.Evnts[id].collisions > MAX_TIMESLOT_COLUMNS) {
                console.error('Cannot add event. It does not fit.');
                return -1;
            }
        }

        _shrinkEvntInTable.call(this, collidingEvnts);

        return maxCollisions;
    }

    // we checked for free space, it's completely empty so it's safe to add
    function _fillEvnt(evnt, fromColumn) {
        for (var i = evnt.start; i < evnt.end; i++) {
            var row = [];
            // tODO: shouldn't this really be just
            // if timetable[i][j] === null, push new id?
            for (var j = 0; j < fromColumn; j++) {
                row.push(this.timeTable[i][j]);
            }
            var evntSizeCounter = 0;
            for (var j = fromColumn; j < MAX_TIMESLOT_COLUMNS; j++) {
                if (evntSizeCounter < evnt.rowSize) {
                    row.push(evnt.id);
                    evntSizeCounter++;
                }
                else {
                    row.push(EMPTYSLOT);
                }
            }
            this.timeTable[i] = row;
        }
        evnt.anchorPoint = 
            (fromColumn === 0) ?
            0 :
            (MAX_TIMESLOT_COLUMNS / fromColumn) - 1;
    }

    // Calendar "class"
    // newEvnt: parsed event, should have id, start, end
    Calendar.prototype.addEvnt = function(newEvnt) {

        // store the event first
        this.Evnts[newEvnt.id] = newEvnt;
        var firstFreeColumn = checkForFreeSpace.call(this, newEvnt);
        var colliders = canItFit.call(this, firstFreeColumn, newEvnt);
        if (!colliders.length) {
            _fillEvnt.call(this, newEvnt, firstFreeColumn);
        }
        else {
            var canAdd = shrinkEvnts.call(this, colliders)
            if(canAdd === -1) {
                return;
            }
            else {
                // TODO: other events are shrunk, find first free column and add event again
                // TODO: maybe group these?
                firstFreeColumn = checkForFreeSpace.call(this, newEvnt);
                newEvnt.collisions = canAdd;
                newEvnt.rowSize = MAX_TIMESLOT_COLUMNS / (newEvnt.collisions + 1);
                _fillEvnt.call(this, newEvnt, firstFreeColumn);
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
            var width = (evntToRender.rowSize === 0) ?
                            100 :
                            Math.floor(100/ (MAX_TIMESLOT_COLUMNS / evntToRender.rowSize));
            var top = evntToRender.start;
            var left = evntToRender.anchorPoint * width;

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
    function createTimeTable(format) {
        // default format = minutes
        var finishedTable;
        var maxSlots;

        switch(format) {
            default:
                maxSlots = 24*60;
                break;
        }

        var rows = [];
        var columns = [];
        for (var i = 0; i < maxSlots; i++) {
            rows.push(EMPTYSLOT);
        }

        finishedTable = rows;

        for (var j = 0; j < MAX_TIMESLOT_COLUMNS; j++) {
            columns.push(EMPTYSLOT);
        }

        for (var i = 0; i < maxSlots; i++) {
            finishedTable[i] = columns;
        }

        return finishedTable;
    }

    // Constructor pattern because we want a Calendar "class"
    function Calendar(arguments) {
        // store all the events present in the calendar
        this.Evnts = [];
        // store list of event ids in here to handle collisions
        this.timeTable = createTimeTable('minutes');

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
