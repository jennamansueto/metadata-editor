export default {
    methods: {
        normalizeClassID: function(class_id){
            return class_id.replace(/\./g, "-");
        },
        nestedArrayToStringValue: function(arr, output='') 
        {
            let vm=this;
            if (Array.isArray(arr)) {
                arr.forEach(function (item) {
                output = vm.nestedArrayToStringValue(item, output);
                });
            } else {
                if (typeof arr === 'object') {
                let keys = Object.keys(arr);
                keys.forEach(function (key) {
                    if (typeof arr[key] === 'object'){
                    output = vm.nestedArrayToStringValue(arr[key], output);
                    }else{
                    output+= " " + arr[key];
                    }            
                });
                }
            }
            return output.trim();
        },
        copyToClipBoard: function(textToCopy){
            const tmpTextField = document.createElement("textarea")
            tmpTextField.textContent = textToCopy
            tmpTextField.setAttribute("style","position:absolute; right:200%;")
            document.body.appendChild(tmpTextField)
            tmpTextField.select()
            tmpTextField.setSelectionRange(0, 99999) /*For mobile devices*/
            document.execCommand("copy")
            tmpTextField.remove();
        },

        pasteFromClipBoard: async function() 
        {
            const text = await navigator.clipboard.readText();
            return text;                    
        },
        CSVToArray: function ( strData, strDelimiter )
        {
            //source: https://gist.github.com/bennadel/9753411#file-code-1-htm
            
            // Check to see if the delimiter is defined. If not,
            // then default to comma.
            strDelimiter = (strDelimiter || ",");

            // Create a regular expression to parse the CSV values.
            var objPattern = new RegExp(
                (
                    // Delimiters.
                    "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                    // Quoted fields.
                    "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                    // Standard fields.
                    "([^\"\\" + strDelimiter + "\\r\\n]*))"
                ),
                "gi"
                );


            // Create an array to hold our data. Give the array
            // a default empty first row.
            var arrData = [[]];

            // Create an array to hold our individual pattern
            // matching groups.
            var arrMatches = null;


            // Keep looping over the regular expression matches
            // until we can no longer find a match.
            while (arrMatches = objPattern.exec( strData )){

                // Get the delimiter that was found.
                var strMatchedDelimiter = arrMatches[ 1 ];

                // Check to see if the given delimiter has a length
                // (is not the start of string) and if it matches
                // field delimiter. If id does not, then we know
                // that this delimiter is a row delimiter.
                if (
                    strMatchedDelimiter.length &&
                    strMatchedDelimiter !== strDelimiter
                    ){

                    // Since we have reached a new row of data,
                    // add an empty row to our data array.
                    arrData.push( [] );

                }

                var strMatchedValue;

                // Now that we have our delimiter out of the way,
                // let's check to see which kind of value we
                // captured (quoted or unquoted).
                if (arrMatches[ 2 ]){

                    // We found a quoted value. When we capture
                    // this value, unescape any double quotes.
                    strMatchedValue = arrMatches[ 2 ].replace(
                        new RegExp( "\"\"", "g" ),
                        "\""
                        );

                } else {

                    // We found a non-quoted value.
                    strMatchedValue = arrMatches[ 3 ];

                }


                // Now that we have our value string, let's add
                // it to the data array.
                arrData[ arrData.length - 1 ].push( strMatchedValue );
            }

            // Return the parsed data.
            return( arrData );
        }
    }
};
