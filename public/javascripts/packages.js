(function() {
  packages = {
    getQuestions: function(){
      return  [
        {name:'class_size',children:[],label:'Class Size'},
        {name:'college_career_ready',children:[],label:'College & Career Ready'},
        {name:'community_engagement',children:[],label:'Community Engagement'},
        {name:'electives_specials',children:[],label:'Electives & Specials'},
        {name:'extracurricular',children:[],label:'Extracurricular'},
        {name:'great_teachers',children:[],label:'Great Teachers'},
        {name:'length_of_school_year',children:[],label:'Length of School Year'},
        {name:'safety',children:[],label:'Safety'},
        {name:'technology',children:[],label:'Technology'}
      ];
    },
    
    getResponses: function(){
      return  [
        'parent/guardian',
        'high school student',
        'community member',
        'staff member',
      ];
    },
    // Lazily construct the package hierarchy from class names.
    root: function(rows, bucket, response) {
      
      var map = {
                  "": {
                        name:"",
                        children:[],
                        parent:null
                      }
                };
      var root = map[""];
      var questions = this.getQuestions();
      questions.forEach(function(question) {
        question.parent = root;
        map[question.name] = question;
        root.children.push(question);
        
        var high = {name:question.name + ':high',parent:question,children:[],label: question.label + ' HIGH'};
        var medium = {name:question.name + ':medium',parent:question,children:[],label: question.label + ' MED'};
        var low = {name:question.name + ':low',parent:question,children:[],label: question.label + ' LOW'};
        
        map[high.name] = high;
        map[medium.name] = medium;
        map[low.name] = low;
        
        question.children.push(high);
        question.children.push(medium);
        question.children.push(low);
        
        if(!bucket) {
          for(var i = 1; i <= questions.length;i++) {
            var name = question.name + ":" + i;
            var parent;
            if(i > 6) {
              parent = low;
            } else if(i > 3) {
              parent = medium;
            } else {
              parent = high;
            }
          
            var node = {name:name,parent:parent,children:[],label:question.name + ' ' + i};
            parent.children.push(node);
            map[node.name] = node;
          }
        }
      });

      return map[""];
    },
    
    links: function(nodes, rows){
      var map = {},
      linkMap = {},
      links = [];
      var questions = this.getQuestions();

      // Compute a map from name to node.
      nodes.forEach(function(d) {
        map[d.data.name] = d;
      });
      
      rows.forEach( function(row){
        questions.forEach( function(sourceQ){
          var sourceAnswer = row[sourceQ.name];
          var sourceKey = sourceQ.name + ':' + sourceAnswer;
          questions.forEach( function(targetQ){
            if(sourceQ !== targetQ) {
              var targetAnswer = row[targetQ.name];
              var targetKey = targetQ.name + ":" + targetAnswer;
              
              if(linkMap[sourceKey]) {
                var link = linkMap[sourceKey][targetKey];
              } else {  
                linkMap[sourceKey] = {};
              }
              if(linkMap[targetKey] && linkMap[targetKey][sourceKey])
              {
                link = linkMap[targetKey][sourceKey];
              }
              if(!link) {
                if(!map[sourceKey] || ! map[targetKey]){
                  console.info('source: ' +  sourceKey);
                  console.info('target: ' + targetKey);
                  console.error('keys missing!');
                  
                }
                link = {source:map[sourceKey],target:map[targetKey],weight:1};
                map[sourceKey].outLink = link;
                map[targetKey].inLink = link;
                map[sourceKey].response = row.response;
                map[targetKey].response = row.response;
                links.push(link);
                linkMap[sourceKey][targetKey] = link;
              } else {
                link.weight += 1;
              }
              
            }

          });
          
        });
      });
      return links;
    },
    
    
    linksBucketed: function(nodes, rows, response){
      var map = {},
        linkMap = {},
        links = [];

      var questions = this.getQuestions();

      // Compute a map from name to node.
      nodes.forEach(function(d) {
        map[d.data.name] = d;
      });
      
      rows.forEach( function(row){
        if(response === undefined || row.response === response) {
          questions.forEach( function(sourceQ){
            var sourceAnswer = row[sourceQ.name];
            var sourceBucket;
            if(sourceAnswer > 6) {
              sourceBucket = 'low';
            } else if(sourceAnswer > 3) {
              sourceBucket = 'medium';
            } else {
              sourceBucket = 'high';
            }
            var sourceKey = sourceQ.name + ':' + sourceBucket;
            questions.forEach( function(targetQ){
              if(sourceQ !== targetQ) {
                var targetAnswer = row[targetQ.name];
              
                var targetBucket;
                if(targetAnswer > 6) {
                  targetBucket = 'low';
                } else if(targetAnswer > 3) {
                  targetBucket = 'medium';
                } else {
                  targetBucket = 'high';
                }
                var targetKey = targetQ.name + ":" + targetBucket;
                
                if(!linkMap[sourceKey]) {
                  linkMap[sourceKey] = {};
                } 
                if(!linkMap[targetKey]) {
                  linkMap[targetKey] = {};
                }
                
                var link = linkMap[sourceKey][targetKey];
                
                
                if(!link) {
                  if(!map[sourceKey] || ! map[targetKey]){
                    console.info('source: ' +  sourceKey);
                    console.info('target: ' + targetKey);
                    console.error('keys missing!');
                  
                  }
                  link = {source:map[sourceKey],target:map[targetKey],weight:0};
                  map[sourceKey].outLink = link;
                  map[targetKey].inLink = link;
                  map[sourceKey].response = row.response;
                  map[targetKey].response = row.response;
                  links.push(link);
                  linkMap[sourceKey][targetKey] = link;
                  linkMap[targetKey][sourceKey] = link;
                } else {
                  link.weight += 1;
                }
              
              }

            });
          
          });
        }
      });
      return links;
    },

    // Return a list of imports for the given array of nodes.
    imports: function(nodes) {
      var map = {},
          imports = [];

      // Compute a map from name to node.
      nodes.forEach(function(d) {
        map[d.data.name] = d;
      });

      // For each import, construct a link from the source to target node.
      nodes.forEach(function(d) {
        if (d.data.answers) d.data.answers.forEach(function(i) {
          imports.push({source: map[d.data.name], target: map[i]});
        });
      });

      return imports;
    }

  };
})();