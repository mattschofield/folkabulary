
var request = require('request')
  , async = require('async')
  , path = require('path')
  , qs = require('qs')
  , fs = require('fs');

var input = fs.readFileSync('/Users/mattsch/Desktop/folkabulary/MY_artists.tsv').toString();

var apikey = process.env.MUSICGRAPH_KEY
  , searchurl = 'http://api.musicgraph.com/api/v2/track/search';


async.eachSeries([1,100,200,300,400,500], function (offset, ringback) {
  async.each(input.split('\n'), function (line, callback) {

    var name = line.split('\t')[0]
      , mbid = line.split('\t')[1];

    console.log('%s has ID: %s', name, mbid);

    var params = {
      api_key: apikey,
      artist_name: name,
      limit: 100,
      offset: offset
    };

    console.log('PARAMS:');
    console.log(params);

    request(searchurl + '?' + qs.stringify(params), function (err, res, body) {
      if (err) {
        console.log(err);
        return callback(err);
      } else {
        var parsed = JSON.parse(body);
        console.log(parsed);

        async.eachSeries(parsed.data, function (track, cb) {

          var params = { api_key: apikey };

          var lyricsurl = 'http://api.musicgraph.com/api/v2/track/'+track.id+'/lyrical-features?'+qs.stringify(params);

          // setTimeout(function () {
            request(lyricsurl, function (err, res, body) {
              if (err) {
                console.log(err);
                return cb(err);
              } else {

                if (!JSON.parse(body).hasOwnProperty('data') || !JSON.parse(body).data.hasOwnProperty('bow')) {
                  return cb();
                } else {
                  var lyrics = JSON.parse(body).data.bow;
                  var output = path.join('.', 'output/'+name+'_'+mbid);
                  var toWrite = lyrics.join(' ') + ' ';

                  fs.appendFileSync(output, toWrite);

                  console.log('Finished writing output for %s', track.title);
                  return cb();
                }
              }
            })
          // }, 3000)
        }, function (err) {
          return callback(err);
        })
      }
    })

  }, function (err) {
    if (err) {
      console.log(err);
    };
    console.log('Done for offset %s', offset);
    ringback(err)
  })
}, function (err) {
  if (err) {
    console.log(err);
  }

  console.log('All done!');
  process.exit(0);
})

