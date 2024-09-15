import axios from 'axios';

export const getCustomerFromERP = (mobile) => {
  mobile = mobile.replace(/\+/g, '')
  let url = process.env.ERP_API_HOST+'/api/post/CustomerDetail';
  url += "?api="+process.env.ERP_API_KEY;
  url += "&mobile="+mobile;
  return axios({
    url,
    method: 'GET',
    raxConfig: {
      retry: 3,
      retryDelay: 2000
    },
    timeout: 3000,
    onRetryAttempt: err => {
      const cfg = rax.getConfig(err);
      console.log(`getCustomerFromERP Retry attempt #${cfg.currentRetryAttempt}`);
    }
  });
}

export const insertCustomerInERP = (firstname, lastname, mobile, email) => {
  if (!mobile) {
    return
  }
  mobile = mobile.replace(/\+/g, '')
  let url = process.env.ERP_API_HOST+'/api/post/Customer';
  url += "?api="+process.env.ERP_API_KEY;
  url += "&firstname="+firstname;
  url += "&lastname="+lastname;
  url += "&mobile="+mobile;
  url += "&email="+email;
  return axios({
    url,
    method: 'POST',
    raxConfig: {
      retry: 3,
      retryDelay: 2000
    },
    timeout: 3000,
    onRetryAttempt: err => {
      const cfg = rax.getConfig(err);
      console.log(`insertCustomerInERP Retry attempt #${cfg.currentRetryAttempt}`);
    }
  });
}