var fluid = require('infusion');

var fsm = fluid.registerNamespace('fsm');
module.exports = fsm;

/* GRADES */
fluid.defaults('fsm.stateMachine', {
    gradeNames: ['fluid.modelComponent'],
    events: {
        processEvent: null,
        changeState: null
    },
    listeners: {
        'processEvent.impl': {
            funcName: 'fsm.stateMachine.processEvent',
            args: ['{that}', '{arguments}.0', '{arguments}.1']
        },
        'changeState.impl': {
            funcName: 'fsm.stateMachine.changeState',
            args: ['{that}', '{arguments}.0']
        }
    }
});

/**
 * Forward an event with an optional data package to the currently active state.
 * @param {Object} that The stateMachine component.
 * @param {String} event The name of the event to be forwarded.
 * @param {any} eventData The optional attached data to be forwarded with the event.
 */
fsm.stateMachine.processEvent = function (that, event, eventData) {
    var state = that.model.state;
    // console.log('processing', state, '.', event);
    that[state].events.processTransition.fire(event, eventData);
};

fsm.stateMachine.changeState = function (that, newState) {
    // console.log('leaving', that.model.state);
    // fire the leave event on the old state
    that.events.processEvent.fire('leave');
    // update the current state
    that.applier.change('state', newState);
    // fire the enter event on the new state
    // console.log('entering', that.model.state);
    that.events.processEvent.fire('enter');
}

fluid.defaults('fsm.state', {
    gradeNames: ['fluid.component'],
    transitions: {},
    events: {
        processTransition: null,
        setTimer: null
    },
    listeners: {
        'processTransition.impl': {
            funcName: 'fsm.state.processTransition',
            args: ['{that}', '{fsm.stateMachine}', '{arguments}.0', '{arguments}.1']
        },
        'setTimer.impl': {
            funcName: 'fsm.state.setTimer',
            args: ['{that}', '{arguments}.0', '{arguments}.1']
        }
    }
});

var resolveInvokerOrEventRecord = function (that, record) {
    var togo = function () {
        throw new Error(`record ${record} could not be resolved to an invoker or event firer`);
    };
    console.log('record', record);
    if (typeof record === 'string') {
        // short form
        if (record.indexOf('events') !== -1) {
            console.log('string-form event firer', fluid.get(that, record));
            throw new Error('TODO: implement recongition of string-form event references');
        } else {
            // invoker
            // can I do fluid.get(that, setTimer)?
            console.log('string-form invoker', fluid.get(that, record));
            throw new Error('TODO: implement recongition of string-form listener references');
        }
    } else {
        // long form
        console.log('object-form listener or event firer', fluid.get(that, record.func));
        throw new Error('TODO: implement recognition of object-form invoker and event references');
    }
};

fsm.state.processTransition = function (that, stateMachine, event, eventData) {
    var transitionRecord = that.options.transitions[event];
    
    if (transitionRecord !== undefined) {
        // if there's a guard predicate, test it before proceeding
        if (transitionRecord.guard) {
            var guardFunc = resolveInvokerOrEventRecord(that, transitionRecord.guard);
            if (!guardFunc(eventData)) {
                return;
            }
        }
        // if there's an action, execute it
        if (transitionRecord.action) {
            if (transitionRecord.action.func !== undefined) {
                if (transitionRecord.action.args !== undefined) {
                    transitionRecord.action.func(...transitionRecord.action.args);
                } else {
                    transitionRecord.action.func(eventData);
                }
            } else if (transitionRecord.action.fire !== undefined) {
                if (transitionRecord.action.args !== undefined) {
                    transitionRecord.action.fire(...transitionRecord.action.args);
                } else {
                    transitionRecord.action.fire(eventData);
                }
            } else {
                console.log(transitionRecord.action);
                throw new Error('TODO');
            }
            // var actionFunc = resolveInvokerOrEventRecord(that, transitionRecord.action);
            // actionFunc(eventData);
        }
        // if there's an explicit next state, inform the containing state machine
        if (transitionRecord.nextState) {
            stateMachine.events.changeState.fire(transitionRecord.nextState);
        }
    }
};

fsm.state.setTimer = function (that, time, eventData) {
    // console.log('setting timer for', time, 'miliseconds');
    setTimeout(function () {
        // console.log('firing timer');
        that.events.processTransition.fire('timeout', eventData);
    }, time);
};

