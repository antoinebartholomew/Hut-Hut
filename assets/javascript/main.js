/*

CATEGORIES

Hotel: 4bf58dd8d48988d1fa931735
B&B: 4bf58dd8d48988d1f8931735
Boarding House: 4f4530a74b9074f6e4fb0100
Hostel: 4bf58dd8d48988d1ee931735
Motel: 4bf58dd8d48988d1fb931735
Resort: 4bf58dd8d48988d12f951735
Vacation Rental: 56aa371be4b08b9a8d5734e1

*/

$(document).ready(function() {

  // User search button click
  $(document).on("click", "#hut-submit", function() {

    // Prevent Default
    event.preventDefault();

    // Construct search object
    var userUrlObj = {
      clientId : "GCAZLY2LL451QYZAJHC10LXCRPDRNDGOVDXLOJAB51HYDBGT",
      clientSecret : "XXS1NU0C10PGX0XGTGQZ44PBIFSARMO0MOSXATTEGBRJX1GC",
      urlBase : "https://api.foursquare.com/v2/venues/explore?",
      // near
      userSearch : $("#hut-input").val().trim(),
      // categoryId
      hotelCategory : "4bf58dd8d48988d1fa931735",
      // limit
      limit : "10"
    }

    // Construct query URL
    var queryUrl = `${userUrlObj.urlBase}&v=20180113&categoryId=${userUrlObj.hotelCategory}&near=${userUrlObj.userSearch}&limit=${userUrlObj.limit}&client_id=${userUrlObj.clientId}&client_secret=${userUrlObj.clientSecret}`;

    console.log(queryUrl);


    // AJAX Request
    $.ajax({
      url : queryUrl,
      method : "GET"
    }).done(function(response) {
      console.log(response);
    });
  });

});
