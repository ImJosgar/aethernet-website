/* Custom JS */

const dayMap = {};
const dayOfWeekMap = {
    0: 'SUN',
    1: 'MON',
    2: 'TUE',
    3: 'WED',
    4: 'THU',
    5: 'FRI',
    6: 'SAT',
};
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const twitchUserMap = {};

function getTimeSuffix(d) {
    return d.getHours() >= 12 ? 'PM' : 'AM';
}

function getTime(d) {
    return (d.getHours() + 11) % 12 + 1;
}

function createNewEvent(calenderEvent) {
    const defaultDescription = 'Come join us while we explore all the new FFXIV Shadowbringers content!';
    const eventDescription = calenderEvent.description == undefined ? defaultDescription : calenderEvent.description;
    const newEvent = {
        'time1': getTime(new Date(calenderEvent.start.dateTime)) + ':00',
        'time2': getTimeSuffix(new Date(calenderEvent.start.dateTime)),
        'twitchName': calenderEvent.summary,
        'twitchProfilePicUrl': '',
        'eventDescription': eventDescription,
        'startTime': new Date(calenderEvent.start.dateTime),
        'endDate': new Date(calenderEvent.end.dateTime)
    }
    return newEvent;
}

function createNewDayObj(dayOfWeek, dayOfMonth, monthName) {
    const newDay = {
        'dayOfWeek': dayOfWeek,
        'dayOfMonth': dayOfMonth,
        'monthName': monthName,
        'events': []
    }
    return newDay;
}

function getDayOfWeek(d) {
    return dayOfWeekMap[d.getDay()];
}

function getMonthName(d) {
    return monthNames[d.getMonth()];
}

function addNewEventToDayMap(newEvent) {
    // ensure the events array remains in-order
    const existingEvents = dayMap[newEvent.startTime.getDate()].events;
    if (!existingEvents.length) {
        existingEvents.push(newEvent);
    } else {
        // existingEvents are not empty, determine where to insert new event
        // 2, 7, 17, 22, 12 --> looking to insert index 2 (3rd number)
        let indexToInsert = 0;
        for (let i = 0; i < existingEvents.length; i++) {
            const existingEvent = existingEvents[i];
            if (existingEvent.startTime > newEvent.startTime) {
                break;
            } else {
                indexToInsert++;
            }
        }
        existingEvents.splice(indexToInsert, 0, newEvent);
    }
    dayMap[newEvent.startTime.getDate()].events = existingEvents;
}

function populateDayMap(calendarEventArr) {
    // create day objects
    if (!calendarEventArr) {
        console.log('No calender events returned, returning.');
        return;
    }
    for (let i = 0; i < calendarEventArr.length; i++) {
        const calendarEvent = calendarEventArr[i];
        if (!calendarEvent.start || !calendarEvent.end || !calendarEvent.summary) {
            console.log('The following calendar event did not contain a start, end or summary:');
            console.log(calendarEvent);
            return;
        }
        const newEvent = createNewEvent(calendarEvent);
        // check if day object already exists for this day
        const startTime = new Date(calendarEvent.start.dateTime);
        let existingDay = dayMap[startTime.getDate()];
        if (!existingDay) {
            // it doesn't exist, create it first then add event to it
            existingDay = createNewDayObj(getDayOfWeek(startTime), startTime.getDate(), getMonthName(startTime));
            dayMap[startTime.getDate()] = existingDay;
        }
        // now add new event
        addNewEventToDayMap(newEvent);
    }
}

/**
 * Take the daysMap and create the set of day objects
 */
function populateDaysContainer() {
    // find <div class="days-container"> and add children to it
    for (const day in dayMap) {
        const dayObj = dayMap[day];
        const newDayElement = '<div class="day" data-day="' + dayObj.dayOfMonth + '">' +
            '<div class="day-name">' + dayObj.dayOfWeek + '</div>' +
            '<div class="day-date">' + dayObj.monthName + ' ' + dayObj.dayOfMonth + '</div>' +
            '</div>';
        $('.days-container').append(newDayElement);
    }
}

function createAndPopulateDayEventsContainers() {
    for (const day in dayMap) {
        const dayObj = dayMap[day];
        // for each day make a new day-events-container
        const newDayEventsContainer = $('<div class="day-events-container" data-day="' + dayObj.dayOfMonth + '"></div>');
        // now loop through each event for this day and generate a new schedule-event row
        for (let i = 0; i < dayObj.events.length; i++) {
            const newEvent = dayObj.events[i];
            newDayEventsContainer.append('<div class="row schedule-event">' +
                '              <div class="event-time">' +
                '                <span class="schedule-event-time">' + newEvent.time1 + '</span><span class="schedule-event-time2">' + newEvent.time2 + '</span>' +
                '              </div>' +
                '              <div class="twitch-profile-pic">' +
                '                <img class="schedule-event-profile-pic" src="' + newEvent.twitchProfilePicUrl + '" data-twitch-name="' + newEvent.twitchName + '"/>' +
                '              </div>' +
                '              <div class="event-description">' +
                '                <div class="streamer-name" data-name="' + newEvent.twitchName + '">' + newEvent.twitchName + '</div>' +
                '                <div class="stream-description">' + newEvent.eventDescription + '</div>' +
                '                <div class="follow"><a target="_blank" href="https://twitch.tv/' + newEvent.twitchName + '">Follow on Twitch!</a></div>' +
                '              </div>' +
                '            </div>');
        }
        $('#schedule-section').append(newDayEventsContainer);
    }
}

function createClickHandler() {
    // now register the click handler
    $('.day').on('click', function() {
        let clickedDate = $(this).data('day');
        // remove selected class from all other days
        $('.day').each(function(index) {
            $(this).removeClass('selected');
        });
        $(this).addClass('selected');
        // Show the corresponding day events and hide all others
        $('.day-events-container').each(function(index) {
            if ($(this).data('day') == clickedDate) {
                $(this).fadeIn();
            }
            else {
                $(this).hide();
            }
        });
    });
    // click the first day or today's date
    // TODO: CLICK TODAY'S DATE AND SCROLL OVER IF TODAY'S DATE IS ON RIGHT SIDE
    $('.day').first().click();
}

function fetchProfileImages() {
    // asynchronously go and populate the profile images for each event
    $('.schedule-event-profile-pic').each(function(index) {
        const twitchName = $(this).data('twitchName');
        const thisImg = $(this); // reference for later in success function
        const delayAmount = 200 * index;
        const callComplete = function(response) {
            if (!response.data) {
                console.log('ERROR: We successfully completed the twitch getUser API call but response did not contain data object!');
            }
            const userObj = response.data[0];
            twitchUserMap[userObj.login] = userObj;
            // update the profile image URL
            thisImg.attr('src', userObj.profile_image_url);
            // now user the user object's display_name property to make sure capitalization and such are correct
            $('.streamer-name[data-name="' + twitchName + '"]').text(userObj.display_name);
        }

        /*
        NOTE: Spread out the calls to twitch API or we will get a 429 (too many requests)
         */
        setTimeout(function() {
            if (!twitchUserMap[twitchName]) {
                $.ajax({
                    url: 'https://api.twitch.tv/helix/users?login=' + twitchName,
                    type: 'GET',
                    beforeSend: function(xhr){xhr.setRequestHeader('Client-ID', 'nogdjownnpxw2f464pxutwidsan0d6');},
                    success: callComplete,
                    error: function (error) {
                        console.log('ERROR: Failed to get the user object from Twitch API with error:');
                        console.log(error);
                    }
                });
            } else {
                // we already have the userObject
                thisImg.attr('src', twitchUserMap[twitchName].profile_image_url);
            }
        }, delayAmount);
    });
}

function createDomElements() {
    populateDaysContainer();
    createAndPopulateDayEventsContainers();
    createClickHandler();
    fetchProfileImages();
}

$( document ).ready(function() {
    $("#viewTeam").on('click', function() {
    	$("html, body").animate({ scrollTop: $('#teamContainer').offset().top }, 1000);
    });
    var scheduleRequest = $.getJSON('http://anetbot-env.8vq3ga82df.us-east-1.elasticbeanstalk.com/schedule',
        function(response) {
            // first check if the Google OAUTH failed (tryagain)
            if (!response.errors) {
                populateDayMap(response);
                createDomElements();
            }
            else {
                // there were errors, retry after 1-second delay to allow OATH to renew credentials :(
                // TODO: fix the OATH garbage on back-end
                setTimeout(function() {
                    var scheduleRequest2 = $.getJSON('http://anetbot-env.8vq3ga82df.us-east-1.elasticbeanstalk.com/schedule',
                        function(response) {
                            // first check if the Google OAUTH failed (try again)
                            if (!response.errors) {
                                populateDayMap(response);
                                createDomElements();
                            }
                            else {
                                // there were errors, oh well we really fucked up :(
                                console.log('ERROR: MEGA-ERROR: Maybe we need to delay this a bit?');
                                return;
                            }
                        })
                        .fail(function(err) {
                            console.log("ERROR: Could not retrieve calendar events a SECOND time:");
                            console.log(err);
                        })
                        .always(function() {
                            $('#scheduleLoadingSpinner').hide();
                        });
                    }, 1000);
            }
        })
        .fail(function(err) {
            console.log("ERROR: Could not retrieve calendar events:");
            console.log(err);
        })
        .always(function() {
            $('#scheduleLoadingSpinner').hide();
        });

    $('#day-right-clicker').click(function() {
        event.preventDefault();
        $('.days-container').animate({
            scrollLeft: "+=300px"
        }, "slow");
    });

    $('#day-left-clicker').click(function() {
        event.preventDefault();
        $('.days-container').animate({
            scrollLeft: "-=300px"
        }, "slow");
    });
});