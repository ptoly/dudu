"use strict";
// Utilities
var PrototypeExtensions = { // http://distillations.2rye.com/2012/02/javascript-tricks-a-data-method-for-prototype/
    data: function (elem, key, val) {
        var DATA_REGEX, ii, nattr, attr, datakey;
        DATA_REGEX = /data-(\w+)/;
        ii = 0;
        nattr = elem.attributes.length;
        if (key && val) {
            elem.setAttribute('data-' + key, val);
        } else {
            for (; ii < nattr; ++ii ) {
                attr = elem.attributes[ii];
                if (attr && attr.name) {
                    var m = attr.name.match(DATA_REGEX);
                    if (m && m.length > 1) {
                        datakey = m[1];
                        if (datakey === key) {
                            return attr.value;
                        }
                    }
                }
            }
        }
    }
};

Element.addMethods(PrototypeExtensions);

// http://stackoverflow.com/questions/979256/sorting-an-array-of-javascript-objects
// Here's a more flexible version, which allows you to create
// reusable sort functions, and sort by any field

var sort_by = function(field, reverse, primer)
{
    var key = primer ? function(x) {return primer(x[field])} : function(x) {return x[field]};

    reverse = [-1, 1][+!!reverse];

    return function (a, b) {
        return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
    }
}

// Localstorage DB creation and schema setup
var dudusLibrary = new localStorageDB("dudus", localStorage);

if( dudusLibrary.isNew() ) // We'll add the schema if it does not exist.
{
    // create the "inactive" table
    dudusLibrary.createTable("todos", ["text", "note", "favorite", "active", "folder", "date", "weight", "created", "reminder"]);

    // commit the database to localStorage
    // all create/drop/insert/update/delete operations should be committed
    dudusLibrary.commit();
}

var dudu;

var DuduLists = Class.create({

    initialize: function (formField)
    {
        "use strict";

        // Default Vars
        this.callback = []; // For processing various callbacks
        this.formField = formField;
        this.activeDudus = dudusLibrary.query("todos", {active : "1"});
        this.inactiveDudus = dudusLibrary.query("todos", {active : "0"});

        // Elements
        this.activeDudusUL = $('activeDudusUL');
        this.inactiveDudusUL = $('inactiveDudusUL');

        // Start the app
        this.refreshLists(this.activeDudus, this.activeDudusUL);
        this.refreshLists(this.inactiveDudus, this.inactiveDudusUL);
        this.updateCompletedItemsHeader();
        this.fieldObserver(this.formField);

        this.rubberNeck();
    },

    // Watch the input field and fire off a new todo item when the enter button is pressed
    fieldObserver: function(el){
        el.observe('keypress', function(event)
        {
            if ( event.keyCode == Event.KEY_RETURN  || event.which == Event.KEY_RETURN )
            {
                this.createDudu();
                // Reinitialize the favorite and done click observers
                Event.stop(event);
            }
        }.bind(this));
    },

    // Watch the flag field and toggle it when clicked
    favoriteObserver: function()
    {
        $('activeDudusWrapper','editForm').invoke('on','click','.favoriteToggle', function(event, element)
        {
            var id, li, editingFromForm, container, remote, toggle;

            container = element.up();
            id = container.hasClassName('duduEdit') ? container.data("id") : container.getAttribute("id"); // Get the record ID.

            // Check to see if we need to toggle a remote favorite toggle.
            if(container.hasClassName('duduEdit')) // Clicking from the form
            {
                editingFromForm = true;
                remote = $(id); // Get the remote dudu wrapper element.
                li = remote.up();
            }
            else // Clicking from a LI
            {
                editingFromForm = false;
                li = container.up();
                if($('editForm').visible())
                {
                    remote = id == $(id+'_editing').data('id') ? $(id+'_editing') : false;
                }
            }

            if( container.hasClassName('unflagged') ) {
                toggle = "1";
                container.removeClassName('unflagged').addClassName('flagged');
                element.removeClassName('glyphicon-star-empty').addClassName('glyphicon-star');
                if(editingFromForm)
                {
                    $(id).removeClassName('unflagged').addClassName('flagged');
                    $(id).down('.glyphicon').removeClassName('glyphicon-star-empty').addClassName('glyphicon-star');
                } else {
                    if(remote)
                    {
                        remote.removeClassName('unflagged').addClassName('flagged');
                        remote.down('.glyphicon').removeClassName('glyphicon-star-empty').addClassName('glyphicon-star');
                    }
                }
            }
            else
            {
                toggle = "0";
                container.removeClassName('flagged').addClassName('unflagged');
                element.removeClassName('glyphicon-star').addClassName('glyphicon-star-empty');
                if(editingFromForm)
                {
                    $(id).addClassName('unflagged').removeClassName('flagged');
                    $(id).down('.glyphicon').addClassName('glyphicon-star-empty').removeClassName('glyphicon-star');
                } else {
                    if(remote)
                    {
                        remote.addClassName('unflagged').removeClassName('flagged');
                        remote.down('.glyphicon').addClassName('glyphicon-star-empty').removeClassName('glyphicon-star');
                    }
                }
            }
            // Update the DB if an ID exists.
            if(id) {
                dudusLibrary.update("todos", {ID: id}, function(row){
                    row.favorite = toggle;
                    return row;
                });
                dudusLibrary.commit();
            }
        });
    },

    // Watch the done checkbox and arrange elements accordingly,
    // and update the DB.
    doneObserver: function()
    {
        $('duduContainer').on('click','.done', function(event, element)
        {
            var id, li, container, remote;

            container = element.up();
            remote = this.remoteChecker(container);
            li = container.hasClassName('duduEdit') ? remote.up() : container.up();
            id = container.hasClassName('duduEdit') ? container.data("id") : container.getAttribute("id"); // Get the record ID.

            // Deactivate.
            if ( element.checked == true )
            {
                container.removeClassName('active').addClassName('inactive');

                inactiveDudusUL.insert({ top: li });

                // Update DB.
                dudusLibrary.update("todos", {ID: id}, function(row)
                {
                    row.active = "0";
                    return row;
                });
            } else { // Activate.

                container.addClassName('active').removeClassName('inactive');

                activeDudusUL.insert({ bottom: li });
                // Update DB.
                dudusLibrary.update("todos", {ID: id}, function(row)
                {
                    row.active = "1";
                    return row;
                });
            }
            dudusLibrary.commit();

            // Remote element changes
            if(remote !== null)
            {
                // Deactivate
                if ( element.checked == true )
                {
                    if(remote.hasClassName('duduEdit')) // From the form context
                    {
                        remote.down('.done').checked = true;
                        element.next('span', 1).addClassName('disabled');
                        container.down('.glyphicon').removeClassName('favoriteToggle'); // Disable the favorite toggle.
                    } else { // Ensure that the form, if activated for this dudo, also gets unchecked.
                        remote.removeClassName('active').addClassName('inactive');
                        remote.down('.done').checked = true;
                    }
                } else {
                    // Activate
                    if(remote.hasClassName('duduEdit'))
                    {
                        $(id+'_editing').removeClassName('inactive').addClassName('active');
                        remote.down('.done').checked = false;
                        element.next('span', 1).removeClassName('disabled');
                        container.down('.glyphicon').addClassName('favoriteToggle'); // Enable the favorite toggle.
                    } else { // Ensure that the form, if activated for this dudo, also gets favorited
                        remote.addClassName('active').removeClassName('inactive');
                        remote.down('.done').checked = false;
                    }
                }

            }

            this.updateCompletedItemsHeader();

        }.bind(this));
    },

    // Updates the completed items header count
    updateCompletedItemsHeader: function()
    {
        var count = $$('#inactiveDudusUL li').length;
        var s = count > 1 ? 's' : '';
        if( count > 0) {
            $('completedDudus').update(count+' Completed Item'+s);
        }
        else
        {
            $('completedDudus').update('');
        }
    },

    // Create a new Dudu item
    createDudu: function()
    {
        var newDudu, favorite, starClass, newID, flagged;

        newDudu = this.formField.getValue();
        favorite = $('favoriteToggle').data('favorite');
        flagged = this.formField.up().hasClassName('unflagged') ? 'unflagged' : 'flagged';
        starClass = favorite == 0 ? '-empty' : '';

        // Need to add this to the DB
        newID = dudusLibrary.insert("todos", {text: newDudu, note: "", favorite: favorite, active : "1", folder : "default", date : "", weight : "0", created: Date.now(), reminder : ""});

        // commit the database to localStorage
        // all create/drop/insert/update/delete operations should be committed
        dudusLibrary.commit();

        // Need to create the <li> block, add in active class and put in in the active <ul>
        activeDudusUL.insert({
            top:'<li data-id="'+newID+'" class="active list-group-item"><div id="'+newID+'" class="duduItem active '+flagged+'"><input class="done" type="checkbox" value="1">' + newDudu + '<span class="glyphicon glyphicon-star'+starClass+' pull-right star favoriteToggle" data-favorite="'+favorite+'"></span></div></li>'
        });

       this.formField.clear();

       // Reset the favorite star - breaks js, don't know why...
       //if( $$('#addDudu span').hasClassName('glyphicon-star') ) $$('#addDudu span').addClassName('glyphicon-star-empty');
    },

    deleteDudu: function(id, text)
    {
        Modalbox.show( $('confirmDelete'),
        {
            title: "Really delete "+text+"?",
            width: 400,
            slideDownDuration: 0.1,
            slideUpDuration: 0.2,
            afterLoad: function(s){
                $('deleteDudu').observe('click', function(e){
                    dudusLibrary.deleteRows("todos", {ID: id});
                    dudusLibrary.commit();
                    Modalbox.hide();
                    $('collapseMe').removeClassName('col-md-4').addClassName('col-md-9');
                    $('editForm').hide();
                    $('editing').remove();
                });
            }
        });
    },

    // Refresh the UL lists of Dudus from local storage
    refreshLists: function(dudos, element)
    {
        if(dudos) {
            var sorted, starClass, checked, active, noted, flagged;
            sorted = dudos.sort(sort_by('weight', false, parseInt));

            sorted.each(function(todo) {
                starClass = todo.favorite == 0 ? '-empty' : '';
                flagged = todo.favorite == 0 ? 'unflagged' : 'flagged';
                checked = todo.active == 0 ? 'checked' : '';
                active = todo.active == 0 ? 'inactive ' : 'active ';
                noted = (typeof todo.note) === "undefined" ? '' : '<span class="glyphicon glyphicon-pencil"></span>';
                element.insert({
                    top:'<li data-ID="'+todo.ID+'" class="'+active+'list-group-item"><div id="'+todo.ID+'" class="duduItem '+flagged+' '+active+'"><input class="done" type="checkbox" value="1" '+checked+'>' + todo.text + noted + '<span class="glyphicon glyphicon-star'+starClass+' pull-right duduItem star favoriteToggle" data-favorite="'+todo.favorite+'"></span></div></li>'
                });
            });
        }
    },

    // Fires up the observers after DOM changes
    rubberNeck: function()
    {
        this.favoriteObserver();
        this.doneObserver();
        this.editObserver();
    },

    // This method checks to see if we need to mirror DOM
    // updates in another element on the page. If there is
    // no remote element to operate on it returns false, else
    // it returns the container element to operate on.
    remoteChecker: function(container)
    {
        var id, remote;

        remote = null;
        if(container.hasClassName('duduEdit'))
        {
            id = container.data("id");
            remote = $(id); // Returns the remote LI.
        } else {
            id = container.getAttribute("id");
            if( $(id+'_editing') !== null && id == $(id+'_editing').data('id') )
            {
                 remote = $(id+'_editing');
            }
        }
        return remote;
    },

    editObserver: function()
    {
        $('collapseMe').on('dblclick','li', function(event, element)
        {
            var id, todo, editForm;

            if( $('collapseMe').hasClassName('col-md-8') )
            {
                // Show the form.
                $('collapseMe').removeClassName('col-md-8').addClassName('col-md-4');
                $('editForm').show();

                // Populate the form.
                id = element.data('id');

                todo = dudusLibrary.query("todos", {ID: id});
                todo = todo[0];

                this.populateEditForm(todo);

                $('closeForm').observe('click', function()
                {
                    element.removeAttribute('id');
                    $('collapseMe').removeClassName('col-md-4').addClassName('col-md-8');
                    $('editForm').hide();
                });
            }
        }.bind(this));
    },

    populateEditForm: function(todo)
    {
        var starClass, checked, active, id, editForm, renderedForm;

        starClass = todo.favorite == 0 ? '-empty' : '';
        checked = todo.active == 0 ? 'checked' : '';
        active = todo.active == 0 ? 'inactive ' : 'active ';
        id = todo.ID;
        // Populate the form with data from the clicked todo
        editForm = new Template('<div class="'+active+'panel panel-default"><div class="panel-heading"><h3 class="panel-title""><div data-id="#{ID}" id="'+id+'_editing" class="duduEdit duduItem '+active+'"><input class="done" type="checkbox" value="1" '+checked+'>&nbsp;&nbsp;<span class="editable" data-attribute="text, #{ID}">#{text}</span><span class="glyphicon glyphicon-star'+starClass+' pull-right duduItem star favoriteToggle" data-favorite="'+todo.favorite+'"></span></div></h3></div><ul class="list-group"><li class="list-group-item"><h6>Note:</h6><div class="note editable" data-type="textarea" data-attribute="note, #{ID}">#{note}</div></li></ul><div class="panel-footer text-center"><span class="glyphicon glyphicon-trash pull-left"></span><small>Created '+moment(todo.created).format("ddd, MMMM Do")+'</small> <span id="closeForm" class="glyphicon glyphicon-expand pull-right"></span></div></div>');

        renderedForm = editForm.evaluate(todo);

        $('editForm').update(renderedForm);

        // Activate in place editing
        $j('.editable').jinplace({
            placeholder: 'Click to edit',
            submitFunction: function(opts, value) {
                // The edit in place library only passes a single optional attribute, so
                // I've put the field and id into an array and passed it along
                // @ fieldIdArray[0] = field
                // @ fieldIdArray[1] = id
                var array, id, field;

                array = opts.attribute.split(","); // Convert the attribute value to a usable array.
                id = parseInt(array[1]);
                field = array[0]; // No workie...

                dudusLibrary.update("todos", {ID: id}, function(row) {
                    // The field var is not working in here so I'm using a switch...
                    switch(field) {
                        case 'text':
                            row.text = value;
                            break;
                        case 'note':
                            row.note = value;
                            break;
                    }
                    // the update callback function returns the modified record
                    return row;
                });
                dudusLibrary.commit();
                return value;
            }
        });

        // Activate the trasher

        $('editForm').down('.glyphicon-trash').observe('click', function(e){
            this.deleteDudu(id, todo.text);
        }.bind(this));
    },


});

// Start the whole program running
Event.observe(window, 'load', function ()
{
    dudu = new DuduLists( $('duduItem') );

}.bind(window));