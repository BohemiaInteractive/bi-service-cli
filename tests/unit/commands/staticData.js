var rewire         = require('rewire');
var sinon          = require('sinon');
var chai           = require('chai');
var sinonChai      = require("sinon-chai");
var chaiAsPromised = require('chai-as-promised');
var Promise        = require('bluebird');
var service        = require('bi-service');

var ConfigMock    = require('../mocks/config.js');
var CLI           = require('../../../lib/index.js').CLI;
var staticDataCmd = rewire('../../../lib/commands/staticData.js');

//this makes sinon-as-promised available in sinon:
require('sinon-as-promised');

var AppManager = service.AppManager;
var App        = service.App;
var staticData = service.staticData;
var expect     = chai.expect;

chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.should();

describe('`staticData` command', function() {
    before(function() {
        //fake app
        var appManager = this.appManager = new AppManager(/*no options needed for mocked apps*/);
        var app = this.app = Object.create(App.prototype, {
            options: {
                value: {name: 'public'}
            }
        });
        var app2 = this.app2 = Object.create(App.prototype, {
            options: {
                value: {name: 'private'}
            }
        });

        appManager.add(app);
        appManager.add(app2);

        this.cli = new CLI(this.appManager, new ConfigMock(), {});
    });

    describe('action', function() {
        before(function() {
            this.staticDataLoadStub = sinon.stub(staticData, 'load');
            this.staticDataGetLoadOptionsStub = sinon.stub(staticData, '$getLastLoadOptions');
            this.action = staticDataCmd.action(this.cli);
        });

        after(function() {
            this.staticDataLoadStub.restore();
            this.staticDataGetLoadOptionsStub.restore();
        });

        beforeEach(function() {
            this.staticDataLoadStub.reset();
            this.staticDataGetLoadOptionsStub.reset();
            this.cli.apps = [];
        });

        it('should return a Promise', function() {
            this.staticDataLoadStub.returns(Promise.resolve());
            this.action({options: {}}, sinon.spy()).should.be.instanceof(Promise);
        });

        describe('-r, --refresh option', function() {
            it('should log an Error when staticData has never been loaded (so we cant reload it)', function() {
                var callback = sinon.spy();
                var logSpy = sinon.spy();
                this.staticDataGetLoadOptionsStub.returns();

                return this.action.call({
                    log: logSpy
                },{
                    options: {refresh: true}
                }, callback).then(function() {
                    callback.should.be.calledOnce;
                    logSpy.should.have.been.calledOnce;
                    logSpy.should.have.been.calledWith(sinon.match.instanceOf(Error));
                });
            });

            it('should call provided callback without any arguments when staticData has been successfully reloaded', function() {
                var callback = sinon.spy();
                var logSpy = sinon.spy();
                this.staticDataGetLoadOptionsStub.returns([
                    {
                        odm: ['/some/path'],
                    }
                ]);

                return this.action.call({
                    log: logSpy
                },{
                    options: {refresh: true}
                }, callback).should.be.fulfilled.then(function() {
                    logSpy.should.have.been.calledOnce;
                    callback.should.be.calledOnce;
                    callback.should.be.calledWith();
                });
            });
        });
    });
});
