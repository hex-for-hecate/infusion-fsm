var fluid = require('infusion');
var fsm = require('./fsm.js');

/* USE EXAMPLE */

// The example state machine distinguishes between quick clicks and longer clicks.
// A use case for this behavior is disambiguating between clicks for pressing and ones for dragging.
// It has three states, idle, waiting, and armed.
// It reacts to mousedown and mouseup events.
// If a mouseup event comes at least 200ms after a mousedown event, an attached listener is fired

/*
 * One proposal for a short form (commentary welcome): 
 * fluid.construct('root.fsm', {
 *     gradeNames: ['fsm.stateMachine'],
 *     options: {
 *         states: {
 *             idle: {
 *                 mousedown: '-> waiting'
 *             },
 *             waiting: {
 *                 enter: 'setTimer(200)'
 *                 timeout: '-> armed'
 *                 mouseup: '-> idle'
 *             },
 *             armed: {
 *                 mouseup: 'doIt -> idle'
 *             }
 *         },
 *         listeners: {
 *             // forward external events to myself
 *             '{that mouse}.events.mousedown': {
 *                 func: '{that}.events.processEvent.fire',
 *                 args: ['mousedown'],
 *                 namespace: 'forwardEvent'
 *             },
 *             '{that mouse}.events.mouseup': {
 *                 func: '{that}.events.processEvent.fire',
 *                 args: ['mouseup'],
 *                 namespace: 'forwardEvent'
 *             },
 *             // produce output in response to a local event
 *             'doIt.log': {
 *                 'this': 'console',
 *                 method: 'log',
 *                 args: ['did it']
 *             }
 *         }
 *     }
 * };
*/

// Actually-excuting-but-unwieldy long form
var exampleFSM = fsm.stateMachine({
    model: {
        state: 'idle'
    },
    components: {
        idle: {
            type: 'fsm.state',
            options: {
                transitions: {
                    mousedown: {
                        nextState: 'waiting'
                    }
                }
            }
        },
        waiting: {
            type: 'fsm.state',
            options: {
                transitions: {
                    enter: {
                        action: {
                            func: '{that}.events.setTimer.fire',
                            args: [200]
                        },
                    },
                    mouseup: {
                        nextState: 'idle'
                    },
                    timeout: {
                        nextState: 'armed'
                    }
                }
            }
        },
        armed: {
            type: 'fsm.state',
            options: {
                transitions: {
                    mouseup: {
                        action: '{fsm.stateMachine}.events.doIt',
                        nextState: 'idle'
                    }
                }
            }
        }
    },
    events: {
        doIt: null
    },
    listeners: {
        // forward external events to myself
        // '{root mouse}.events.mousedown': {
        //     func: '{that}.events.processEvent.fire',
        //     args: ['mousedown'],
        //     namespace: 'forwardEvent'
        // },
        // '{root mouse}.events.mouseup': {
        //     func: '{that}.events.processEvent.fire',
        //     args: ['mouseup'],
        //     namespace: 'forwardEvent'
        // },
        // produce output in response to a local event
        'doIt.log': {
            'this': 'console',
            method: 'log',
            args: ['did it']
        }
    }
});

console.log('holding down mouse for 100ms');
exampleFSM.events.processEvent.fire('mousedown');
setTimeout(function () {
    exampleFSM.events.processEvent.fire('mouseup');
}, 100);
console.log('holding down mouse for 200ms');
exampleFSM.events.processEvent.fire('mousedown');
setTimeout(function () {
    exampleFSM.events.processEvent.fire('mouseup');
}, 200);
// mouse.events.mousedown.fire();
// mouse.events.mouseup.fire();
