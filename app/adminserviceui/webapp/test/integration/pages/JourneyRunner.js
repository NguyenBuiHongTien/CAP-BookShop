sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"adminserviceui/test/integration/pages/AuthorsList.gen",
	"adminserviceui/test/integration/pages/AuthorsObjectPage.gen"
], function (JourneyRunner, AuthorsListGenerated, AuthorsObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('adminserviceui') + '/test/flp.html#app-preview',
        pages: {
			onTheAuthorsListGenerated: AuthorsListGenerated,
			onTheAuthorsObjectPageGenerated: AuthorsObjectPageGenerated
        },
        async: true
    });

    return runner;
});

