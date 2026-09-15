using AdminService as service from '../../srv/admin-service';

// =====================================================
// 1. Annotation cho Authors
// =====================================================
annotate service.Authors with @odata.draft.enabled;
annotate service.Books with @odata.draft.enabled;
annotate service.Genres with @odata.draft.enabled;

annotate service.Authors with @(
    UI.Identification: [
        {
            $Type : 'UI.DataField',
            Value : name
        }
    ]
);

annotate service.Authors with @(
    UI.HeaderInfo : {   
        $Type          : 'UI.HeaderInfoType',
        TypeName       : 'Author',
        TypeNamePlural : 'Authors',
        Title          : {
            $Type : 'UI.DataField',
            Value : name
        },
        Description    : {
            $Type : 'UI.DataField',
            Value : ID
        }
    },

    UI.SelectionFields : [
        ID,
        name
    ],

    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : ID,
            Label : 'ID'
        },
        {
            $Type : 'UI.DataField',
            Value : name,
            Label : 'Author Name'
        }
    ],

    UI.FieldGroup #General : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            { $Type: 'UI.DataField', Value: ID,          Label: 'ID' },
            { $Type: 'UI.DataField', Value: name,        Label: 'Author Name' },
            { $Type: 'UI.DataField', Value: createdAt,   Label: 'Created At' },
            { $Type: 'UI.DataField', Value: createdBy,   Label: 'Created By' },
            { $Type: 'UI.DataField', Value: modifiedAt,  Label: 'Modified At' },
            { $Type: 'UI.DataField', Value: modifiedBy,  Label: 'Modified By' }
        ]
    },

    UI.Facets : [
        {
            $Type  : 'UI.ReferenceFacet',
            ID     : 'GeneralFacet',
            Label  : 'General Information',
            Target : '@UI.FieldGroup#General'
        },
        {
            $Type  : 'UI.ReferenceFacet',
            ID     : 'BooksFacet',
            Label  : 'Books by this Author',
            Target : 'books/@UI.LineItem'          
        }
    ]
);

annotate service.Books with {

    author @Common.ValueList : {
        Label : 'Author',
        CollectionPath : 'Authors',
        Parameters : [
            {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : author_ID,
                ValueListProperty : 'ID'
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'name'
            }
        ]
    };

};

// =====================================================
// 2. BẮT BUỘC: Annotation UI.LineItem cho Books
// =====================================================
annotate service.Books with @(

    UI.HeaderInfo : {
    TypeName : 'Book',
    TypeNamePlural : 'Books',

    Title : {
        $Type : 'UI.DataField',
        Value : title
    },

    Description : {
        $Type : 'UI.DataField',
        Value : ID
    }
},
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : ID,
            Label : 'Book ID'
        },
        {
            $Type : 'UI.DataField',
            Value : title,
            Label : 'Title'
        },
        {
            $Type : 'UI.DataField',
            Value : genre.name,          
            Label : 'Genre'
        },
        {
            $Type : 'UI.DataField',
            Value : stock,
            Label : 'Stock'
        },
        {
            $Type : 'UI.DataField',
            Value : price,
            Label : 'Price'
        },
        {
            $Type : 'UI.DataField',
            Value : currency_code,
            Label : 'Currency'
        }
    ],

     UI.FieldGroup #General : {
        Data : [
            { $Type: 'UI.DataField', Value: title, Label:'Name Of Book' },
            { $Type: 'UI.DataField', Value: descr, Label: 'Description' },
            { $Type: 'UI.DataField', Value: author.name, Label: 'Author' },
            { $Type: 'UI.DataField', Value: genre.name, Label: 'Genre' },
            { $Type: 'UI.DataField', Value: stock, Label: 'Stock' },
            { $Type: 'UI.DataField', Value: price, Label: 'Price' },
            { $Type: 'UI.DataField', Value: currency_ID, Label: 'Currency' }
        ]
    },

    UI.Facets : [{
        $Type  : 'UI.ReferenceFacet',
        Target : '@UI.FieldGroup#General',
        Label  : 'General Information'
    }]
);


annotate service.Genres with @(

    UI.HeaderInfo : {
        TypeName : 'Genre',
        TypeNamePlural : 'Genres',
        Title : {
            Value : name
        }
    },

    UI.LineItem : [
        {
            Value : ID
        },
        {
            Value : name
        },
        {
            Value : descr
        }
    ],

    UI.FieldGroup #General : {
        Data : [
            {
                Value : ID
            },
            {
                Value : name
            },
            {
                Value : descr
            }
        ]
    },

    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            Target : '@UI.FieldGroup#General',
            Label : 'General Information'
        }
    ]
);