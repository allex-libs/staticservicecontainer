function createMixin (execlib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q;

  function StaticServiceContainerMixin (replacemap) {
    this.staticalServiceStarterReplaceMap = replacemap || {};
    if (!(this.readyToAcceptUsersDefer && lib.isFunction(this.readyToAcceptUsersDefer.resolve))) {
      throw new lib.Error('IS_INITIALLY_READY', this.constructor.name+' has to be NOT isInitiallyReady');
    }
    this.doServicesToStartStatically().then(
      this.readyToAcceptUsersDefer.resolve.bind(this.readyToAcceptUsersDefer, true)
    );
  }

  StaticServiceContainerMixin.prototype.destroy = function () {
    this.staticalServiceStarterReplaceMap = null;
  };

  StaticServiceContainerMixin.prototype.doServicesToStartStatically = function () {
    if (!lib.isArray(this.servicesToStartStatically)) {
      throw new lib.Error('NO_SERVICES_TO_START_STATICALLY', this.constructor.name+' has to have servicesToStartStatically as an Array of "needs"');
    }
    return q.all(this.servicesToStartStatically.map(staticalServiceStarter.bind(null, this)));
  };

  StaticServiceContainerMixin.addMethods = function (klass) {
    lib.inheritMethods(klass, StaticServiceContainerMixin,
      'doServicesToStartStatically'
    );
  };

  function staticalServiceStarter (service, need) {
    if (!(need && 
      ('modulename' in need) &&
      ('instancename' in need))) {
      throw new lib.Error('NEED_MALFORMED', 'Each need in servicesToStartStatically has to have at least a "modulename" and an "instancename"');
    } 
    var myneed = replaceValuesInObj(service.staticalServiceStarterReplaceMap, need);
    return service.startSubServiceStatically(
      myneed.modulename,
      myneed.instancename,
      myneed.propertyhash
    );
  }

  function replaceValuesInObj (replacemap, obj) {
    var ret = {}, _r = ret, _rm = replacemap;
    lib.traverseShallow(obj, replaceValuesInObjOnTraverse.bind(null, _rm, _r));
    _rm = null;
    _r = null;
    return ret;
  }

  function replaceValuesInObjOnTraverse (replacemap, dest, srcval, srcname) {
    if ('object' === typeof srcval && srcval) {
      dest[srcname] = replaceValuesInObj(replacemap, srcval);
      return;
    }
    dest[srcname] = maybeReplace(replacemap, srcval);
  }

  function maybeReplace (replacemap, val) {
    if (replacemap && val in replacemap) {
      return replacemap[val];
    }
    return val;
  }

  return StaticServiceContainerMixin;
}

module.exports = createMixin;
