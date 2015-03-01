'use strict';

angular.module('gadgetinApp')
  .controller('GadgetsCtrl', function ($scope, Auth, utils, api, ngDialog, smoothScroll, $timeout) {
    $scope.changeView = utils.changeView;
    Auth.getCurrentUser(function(user) {
      $scope.profile = user;
    });
    $scope.search = {};
    $scope.showLimit = 2;

    $scope.search.change = function() {
      $scope.showLimit = 2;
    };

    $scope.showMore = function() {
      $scope.showLimit += 5;
      $timeout(function() {
        var element = document.getElementById('product-' + $scope.showLimit);
        smoothScroll(element);
      }, 10);
    };

    api.getProducts().then(
      function(data) {
        $scope.products = data;
    });

    $scope.clickToOpen = function(product) {
        product.feedback = {};
        $scope.currentProduct = product;
        var dialog = ngDialog.open(
          {templateUrl: 'assets/popups/_add_gadget_popup.html',
           scope: $scope,
           showClose: false,
           appendTo: '#page-wrapper'}
        );
        dialog.closePromise.then(function (data) {
            if (data.value) {
                var product = data.value;
                var newUserProduct = {
                  relatedProduct: product._id,
                  category: product.category,
                  name: product.name,
                  company: product.company,
                  imageUrl: product.imageUrl,
                  specs: product.specs,
                  feedback: {text: product.feedback.text, rating: product.feedback.rating}
                };
                $scope.profile.addProduct(newUserProduct).then(
                  function(data) {
                    $scope.profile.products.unshift(data);
                  });
                $scope.changeView('/profile');
            }
        });
    };
  });
