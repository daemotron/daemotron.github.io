var myTemplateConfig = {
  colors: [ "#F00", "#0F0", "#00F" ], // branches colors, 1 per column
  branch: {
    lineWidth: 8,
    spacingX: 50,
    showLabel: true,                  // display branch names on graph
  },
  commit: {
    spacingY: -80,
    dot: {
      size: 12
    },
    message: {
      displayAuthor: true,
      displayBranch: false,
      displayHash: false,
      font: "normal 12pt Arial"
    },
    shouldDisplayTooltipsInCompactMode: false, // default = true
    tooltipHTMLFormatter: function ( commit ) {
      return "" + commit.sha1 + "" + ": " + commit.message;
    }
  }
};

var myMetroTemplateConfig = {
    colors: ["#979797", "#E84BA5", "#008fb5", "#f1c109", "#ff0000"],
    branch: {
      lineWidth: 4,
      spacingX: 130,
      showLabel: true,
      labelRotation: 0
    },
    commit: {
      spacingY: -60,
      dot: {
        size: 12
      },
      message: {
        font: "normal 8pt Arial"
      }
    }
}

var myTemplate = new GitGraph.Template( myTemplateConfig );
var myMetro = new GitGraph.Template( myMetroTemplateConfig );

var config = {
    template: myMetro,
    reversearrow: false,
    orientation: "vertical",
    mode: "compact"
};

var gitGraph = new GitGraph(config);

var master = gitGraph.branch("master");

gitGraph.commit("Initial commit");

var feature1 = gitGraph.branch("feature");

feature1.commit().commit();

feature1.merge(master);

var feature2 = gitGraph.branch({
    parentBranch: master,
    name: "feature",
    column: 1
});

var release1 = gitGraph.branch({
    parentBranch: master,
    name: "release/1.0",
    column: 2
});


feature2.commit().commit();

release1.commit({
    tag: "1.0-rc1"
});

release1.commit({
    tag: "1.0.0"
});
release1.merge(master);
master.commit();
master.commit();
var hotfix101 = gitGraph.branch({
    parentBranch: release1,
    name: "hotfix/1.0.1",
    column: 4
});

master.merge(feature2);
feature2.merge(master);


hotfix101.commit();
hotfix101.merge(release1, { dotColor: "red", tag: "1.0.1" });

var release2 = gitGraph.branch({
    parentBranch: master,
    name: "release/1.1",
    column: 3
});
release2.commit();


release1.merge(master);

release1.merge(release2);
release2.commit({
    tag: "1.1-rc1"
});
release2.commit({
    tag: "1.1.0"
});

release2.merge(master);
